"""Minimal GLB reader/writer helpers (numpy)."""
import json, struct, numpy as np

CT = {5120: np.int8, 5121: np.uint8, 5122: np.int16, 5123: np.uint16, 5125: np.uint32, 5126: np.float32}
NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}


def load(path):
    b = open(path, 'rb').read()
    magic, ver, ln = struct.unpack('<III', b[:12])
    assert magic == 0x46546C67
    off = 12; js = None; bin_ = b''
    while off < ln:
        cl, ct = struct.unpack('<II', b[off:off + 8]); ch = b[off + 8: off + 8 + cl]
        if ct == 0x4E4F534A: js = json.loads(ch)
        elif ct == 0x004E4942: bin_ = ch
        off += 8 + cl
    return js, bytearray(bin_)


def acc(js, bin_, i):
    a = js['accessors'][i]; bv = js['bufferViews'][a['bufferView']]
    dt = np.dtype(CT[a['componentType']]); n = NC[a['type']]
    o = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    stride = bv.get('byteStride', 0)
    if stride and stride != dt.itemsize * n:
        rows = np.frombuffer(bytes(bin_[o:o + stride * a['count']]), np.uint8).reshape(a['count'], stride)
        arr = rows[:, :dt.itemsize * n].copy().view(dt).reshape(a['count'], n)
    else:
        arr = np.frombuffer(bytes(bin_[o:o + dt.itemsize * n * a['count']]), dt).reshape(a['count'], n)
    if a.get('normalized'):
        arr = arr.astype(np.float32) / np.iinfo(dt).max
    return arr


def image_bytes(js, bin_, i):
    bv = js['bufferViews'][js['images'][i]['bufferView']]
    o = bv.get('byteOffset', 0)
    return bytes(bin_[o:o + bv['byteLength']])


def save(path, js, bin_):
    while len(bin_) % 4: bin_ += b'\0'
    js['buffers'][0]['byteLength'] = len(bin_)
    jb = json.dumps(js, separators=(',', ':')).encode()
    while len(jb) % 4: jb += b' '
    out = struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(jb) + 8 + len(bin_))
    out += struct.pack('<II', len(jb), 0x4E4F534A) + jb + struct.pack('<II', len(bin_), 0x004E4942) + bytes(bin_)
    open(path, 'wb').write(out)


def replace_image(js, bin_, i, data, mime=None):
    """Append new image bytes at the end of the buffer and point the image's bufferView there (old bytes are dropped by
    rebuilding the buffer without unreferenced views)."""
    bvi = js['images'][i]['bufferView']
    keep = []
    for k, bv in enumerate(js['bufferViews']):
        o = bv.get('byteOffset', 0)
        keep.append(bytes(bin_[o:o + bv['byteLength']]) if k != bvi else data)
    nb = bytearray()
    for k, bv in enumerate(js['bufferViews']):
        while len(nb) % 4: nb += b'\0'
        bv['byteOffset'] = len(nb); bv['byteLength'] = len(keep[k]); nb += keep[k]
    if mime: js['images'][i]['mimeType'] = mime
    return nb
