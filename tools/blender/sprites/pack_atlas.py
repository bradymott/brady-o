# Packs rendered sprite frames and background strips into one atlas: <out>.png plus <out>.js (Atlas.register(...)).
# Runs inside Blender's Python (numpy; no PIL):
#   /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/sprites/pack_atlas.py -- <spec.json> <out_base>
# spec.json: { "name": "mx", "scale": 3, "max": 2048,
#              "frames": [ { "id": "pepper_idle_000", "file": "...png", "ox": 123.5, "oy": 456 } ],
#              "anims":  { "pepper/idle": { "frames": ["pepper_idle_000", ...], "fps": 8, "loop": true } },
#              "strips": [ { "id": "bg_far", "file": "...png" } ] }
# Frames are trimmed to their opaque pixels (the origin moves with them); strips are trimmed top and bottom only
# (`top` records the rows removed above) so they stay seamless in x.
import bpy, numpy as np, os, sys, json, math
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import imgkit as IK

def trim(a, pad=1):
    al = a[..., 3] > 0.004
    rows = np.where(al.any(axis=1))[0]; cols = np.where(al.any(axis=0))[0]
    if not len(rows): return a[:1, :1], 0, 0
    y0, y1 = max(0, rows[0] - pad), min(a.shape[0], rows[-1] + 1 + pad)
    x0, x1 = max(0, cols[0] - pad), min(a.shape[1], cols[-1] + 1 + pad)
    return a[y0:y1, x0:x1], x0, y0

def trim_rows(a, pad=1):
    al = a[..., 3] > 0.004
    rows = np.where(al.any(axis=1))[0]
    if not len(rows): return a[:1], 0
    y0, y1 = max(0, rows[0] - pad), min(a.shape[0], rows[-1] + 1 + pad)
    return a[y0:y1], y0

def shelf_pack(items, maxw):
    """items: [(id, w, h)] -> {id: (x, y)}, total height. Tallest first, rows of equal-ish height."""
    order = sorted(items, key=lambda it: (-it[2], -it[1]))
    pos = {}; x = y = rowh = 0
    for id_, w, h in order:
        if x + w > maxw:
            x = 0; y += rowh + 1; rowh = 0
        pos[id_] = (x, y); x += w + 1; rowh = max(rowh, h)
    return pos, y + rowh

def main():
    argv = sys.argv[sys.argv.index('--') + 1:]
    specs = [json.load(open(f)) for f in argv[:-1]]; out = argv[-1]
    spec = {'name': specs[0]['name'], 'scale': specs[0].get('scale', 3), 'max': specs[0].get('max', 2048), 'frames': [], 'anims': {}, 'strips': []}
    for sp in specs:
        spec['frames'] += sp.get('frames', []); spec['strips'] += sp.get('strips', []); spec['anims'].update(sp.get('anims', {}))
    maxw = spec.get('max', 2048)
    images = {}; items = []; meta = {'scale': spec.get('scale', 3), 'image': os.path.basename(out) + '.png', 'frames': {}, 'anims': spec.get('anims', {}), 'strips': {}}
    for f in spec.get('frames', []):
        a = IK.load(f['file']); x0 = y0 = 0
        if not f.get('notrim'): a, x0, y0 = trim(a)
        images[f['id']] = a; items.append((f['id'], a.shape[1], a.shape[0]))
        meta['frames'][f['id']] = {'w': a.shape[1], 'h': a.shape[0], 'ox': round(f['ox'] - x0, 2), 'oy': round(f['oy'] - y0, 2)}
    for s in spec.get('strips', []):
        a = IK.load(s['file']); a, top = trim_rows(a)
        images[s['id']] = a; items.append((s['id'], a.shape[1], a.shape[0]))
        meta['strips'][s['id']] = {'w': a.shape[1], 'h': a.shape[0], 'top': round(top / meta['scale'], 2)}
    pos, H = shelf_pack(items, maxw)
    H = int(min(4096, max(1, H)))
    if H > 4096: raise SystemExit('atlas too tall: %d' % H)
    W = maxw if any(p[0] + images[i].shape[1] > 1024 for i, p in pos.items()) else 1024
    sheet = np.zeros((H, W, 4), np.float32)
    for id_, (x, y) in pos.items():
        im = images[id_]; sheet[y:y + im.shape[0], x:x + im.shape[1]] = im
        d = meta['frames'].get(id_) or meta['strips'].get(id_); d['x'] = x; d['y'] = y
    IK.save(sheet, out + '.png')
    with open(out + '.js', 'w') as fh:
        fh.write('window.BRADY_ATLAS.register(%s, %s);\n' % (json.dumps(spec['name']), json.dumps(meta, separators=(',', ':'))))
    print('PACKED', out + '.png', W, 'x', H, len(meta['frames']), 'frames', len(meta['strips']), 'strips')

if __name__ == '__main__':
    try: main()
    except Exception:
        import traceback; traceback.print_exc(); sys.exit(1)
