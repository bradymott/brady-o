# Renders the Mexico chili (mx_pepper.py) poses as sprite frames in a candidate look.
#   LOOK=toon|paint|ink OUT=<dir> SCALE=<texels per logical px> POSES="idle:0,idle:0.5,hop:0,land:0,stun:0,flat:0,ko:0"
import bpy, os, sys, json
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import lookkit as LK
import mx_pepper as PEP

BOX_W, BOX_H, FOOT = 1.1, 1.2, 0.08

def main():
    look = os.environ.get('LOOK', 'toon'); out = os.environ.get('OUT', '/tmp/pepper'); scale = float(os.environ.get('SCALE', LK.TEX))
    poses = [p.split(':') for p in os.environ.get('POSES', 'idle:0,hop:0').split(',')]
    LK.setup_render('BLENDER_EEVEE', samples=int(os.environ.get('SAMPLES', '32')))
    px_m = LK.PPM * scale; res_w, res_h = int(round(BOX_W * px_m)), int(round(BOX_H * px_m))
    LK.ortho_camera(0.0, BOX_H / 2 - FOOT, BOX_W, BOX_H, res_w, res_h)
    LK.lights(look, key_dir=(0.35, -0.75, 0.9))
    meta = {'look': look, 'scale': scale, 'px_per_m': px_m, 'box': [BOX_W, BOX_H], 'origin': [res_w / 2, res_h - FOOT * px_m], 'frames': {}}
    for pose, t in poses:
        root = PEP.build_pepper(pose=pose, t=float(t))
        objs = LK.all_meshes(root)
        LK.apply_look(look, objs, outline_px=float(os.environ.get('OUTLINE', '0.8')))
        name = f'pepper_{pose}_{int(round(float(t) * 100)):03d}'
        p = LK.render(os.path.join(out, name + '.png'))
        meta['frames'][name] = {'pose': pose, 't': float(t)}
        print('RENDERED', p)
    with open(os.path.join(out, 'pepper_meta.json'), 'w') as f: json.dump(meta, f, indent=1)

if __name__ == '__main__':
    try: main()
    except Exception:
        import traceback; traceback.print_exc(); sys.exit(1)
