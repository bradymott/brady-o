# Burning Man hero prop: a camp shade structure (replaces BurnsProps.shade, authored at w = 5, d = 5, h = 2.9).
# The game emits the roots separately so any w × d × h fits: `body` (the cover and its frame, scaled w/5 × 1 × d/5 and
# lifted to h), `pole` (one pipe leg at the origin, placed at each corner and stretched to h), `guy` (one guy line +
# stake running from the pole top toward +X+Z, yawed per corner) and `lights` (the front string of bulbs, stretched to w).
# Material `cover` is recoloured from opts.col (and tinted per copy in the city).
# The props pass (Nov 24) rebuilt the cover like a real playa shade: an EMT pipe frame (perimeter, a ridge and a cross
# pipe, corner fittings), knitted shade cloth stretched over it that sags in each quarter between the pipes, a valance
# that hangs past the frame on all four sides with a scalloped, hemmed lower edge, zip ties along the pipes, ratchet
# straps at the corners, and baked AO (under the pipes, in the folds) with sun-bleached tops. Two levels: hi and lo.
# Live Blender:  import runpy; runpy.run_path('<repo>/tools/blender/bm_shade.py', run_name='__main__')
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bmkit import *

W0, D0, H0 = 5.0, 5.0, 2.9
NEON = ['#ff4fd8', '#38f2ff', '#ffe24a', '#7aff5a', '#ff7a3a', '#9a6bff', '#ff3a6a']
VAL = 0.32          # valance drop below the frame
OV = 0.12           # cloth overhang past the frame

def build(B):
    L = B.L; lo = B.lo
    M_cover = mat('cover', '#e4dccb', rough=0.75)          # matte knit cloth
    M_hem = mat('hem', '#b8b0a0', rough=0.7)
    M_pipe = metal('pipe', '#a4a6ae', 0.35)
    M_fit = satin('fitting', '#5a5c64', 0.5)
    M_strap = matte('strap', '#d8a020', 0.6)
    M_tie = matte('tie', '#1c1c20', 0.6)
    hw, hd = W0 / 2, D0 / 2
    # ---- the cover: sags in each quarter between the perimeter, ridge (x = 0) and cross (z = 0) pipes ----
    def top_y(x, z):
        qx = 1 - abs(abs(x) / hw * 2 - 1)        # 0 on a pipe, 1 midway between pipes
        qz = 1 - abs(abs(z) / hd * 2 - 1)
        qx, qz = max(0, min(1, qx)), max(0, min(1, qz))
        ripple = 0.012 * math.sin((x + z) * 5.0) * qx * qz
        return H0 + 0.05 - 0.16 * math.sin(qx * math.pi / 2) * math.sin(qz * math.pi / 2) + ripple
    n = B.pick(14, 4)
    def top(u, v, dy=0.0):
        x, z = (u - 0.5) * W0, (v - 0.5) * D0
        return (x, top_y(x, z) + dy, z)
    B.obj('cover', merge(bm_surf(n, n, top), flip(bm_surf(n, n, lambda u, v: top(u, v, -0.015)))), M_cover)
    # ---- the valance: from the frame edge out and down, scalloped between the pipe ends, both sides ----
    nv = B.pick(12, 3)
    def val_side(k):
        # side k: 0 front (+z), 1 right (-x), 2 back (-z), 3 left (+x); t along the side 0..1
        def P(t, s, dy=0.0, push=0.0):
            a = (t - 0.5) * (W0 if k % 2 == 0 else D0)
            scallop = 0.1 * abs(math.sin(t * math.pi * 2))       # the hem rides up between the corner and the middle pipe
            drop = VAL - scallop
            y = H0 + 0.05 - s * drop + dy
            out = (hd if k % 2 == 0 else hw) + OV * math.sin(s * math.pi / 2) + push
            if k == 0: return (a, y, out)
            if k == 1: return (-out, y, -a)
            if k == 2: return (-a, y, -out)
            return (out, y, a)
        return P
    for k in range(4):
        P = val_side(k)
        outer = bm_surf(nv, B.pick(2, 1), lambda u, v, P=P: P(u, v))
        outer.normal_update(); ov = E(*[(0, 0, 1), (-1, 0, 0), (0, 0, -1), (1, 0, 0)][k])
        if sum(f.normal.dot(ov) for f in outer.faces) < 0: bmesh.ops.reverse_faces(outer, faces=outer.faces)
        sheet = outer if lo else merge(outer, flip(bm_surf(nv, 2, lambda u, v, P=P: P(u, v, 0, -0.012))))
        B.obj('valance_%d' % k, sheet, M_cover)
        if not lo:
            B.obj('hem_%d' % k, bm_tube([P(i / nv, 1.0, 0, 0.004) for i in range(nv + 1)], 0.018, 3, caps=False), M_hem)
    # ---- the frame: perimeter pipes, the ridge and cross pipes, corner and tee fittings ----
    c = [(hw, H0, hd), (-hw, H0, hd), (-hw, H0, -hd), (hw, H0, -hd)]
    rod = (lambda a, b, r, n: bm_rod_open(a, b, r, 3)) if lo else bm_rod
    for k in range(4): B.obj('edge_%d' % k, rod(c[k], c[(k + 1) % 4], 0.03, L['rod']), M_pipe)
    B.obj('ridge', rod((0, H0, -hd), (0, H0, hd), 0.03, L['rod']), M_pipe)
    B.obj('cross', rod((-hw, H0, 0), (hw, H0, 0), 0.03, L['rod']), M_pipe)
    for k in (range(4) if not lo else ()): B.obj('corner_%d' % k, bm_box(0.12, 0.1, 0.12, c[k]), M_fit, bevel=B.pick(0.02, None), bevel_angle=False, segments=1)
    if not lo:
        for p in ((0, H0, hd), (0, H0, -hd), (hw, H0, 0), (-hw, H0, 0), (0, H0, 0)):
            B.obj('tee_%d_%d' % (int(p[0] * 10), int(p[2] * 10)), bm_box(0.1, 0.08, 0.1, p), M_fit)
        # zip ties along the perimeter pipes (little dark bands, every 0.8 m)
        for k in range(4):
            a, b = c[k], c[(k + 1) % 4]
            for i in range(1, 4):
                t = i / 4; p = tuple(a[j] + (b[j] - a[j]) * t for j in range(3))
                ax = AX if abs(b[0] - a[0]) > 0.1 else AZ
                B.obj('tie_%d_%d' % (k, i), bm_cyl(0.036, 0.036, 0.02, 5, ax, p, caps=False), M_tie)
        # ratchet straps from each corner down to the pole's foot (yellow webbing, a buckle)
        for k, (x, y, z) in enumerate(c):
            B.obj('strap_%d' % k, bm_box(0.035, 0.5, 0.01, (x * 1.01, y - 0.3, z * 1.01), M=rot(yaw=math.atan2(x, z))), M_strap)
            B.obj('buckle_%d' % k, bm_box(0.06, 0.08, 0.03, (x * 1.012, y - 0.42, z * 1.012), M=rot(yaw=math.atan2(x, z))), M_fit)
    # ---- one pole (root `pole`): a pipe leg with a foot plate, a sandbag tie and a clamp ----
    Pole = B.bone('pole', (0, 0, 0))
    B.obj('pole_pipe', (bm_rod_open((0, 0, 0), (0, H0 - 0.02, 0), 0.05, 4) if lo else bm_rod((0, 0, 0), (0, H0 - 0.02, 0), 0.045, L['rod'])), M_pipe, parent=Pole)
    if not lo: B.obj('pole_foot', bm_box(0.3, 0.03, 0.3, (0, 0.015, 0)), matte('foot', '#5a5a62'), parent=Pole)
    if not lo: B.obj('pole_clamp', bm_cyl(0.07, 0.07, 0.12, L['cyl_s'], AY, (0, H0 - 0.08, 0)), M_fit, parent=Pole)
    if not lo:
        B.obj('pole_band', bm_cyl(0.05, 0.05, 0.08, 6, AY, (0, 1.2, 0), caps=False), matte('tape', '#ff4fd8'), parent=Pole)
        B.obj('rebar', bm_rod((0.12, -0.05, 0.0), (0.12, 0.45, 0.0), 0.012, 5), satin('rebar', '#6a4030', 0.6), parent=Pole)
        B.obj('rebar_cap', bm_ico(0.05, 1, (0.12, 0.46, 0.0)), matte('tennis', '#d8f040', 0.6), parent=Pole)   # a tennis ball on the rebar
        B.obj('pole_tie', bm_cyl(0.075, 0.075, 0.02, 6, AY, (0.04, 0.3, 0), caps=False), M_tie, parent=Pole)
    # ---- one guy line (root `guy`): a cable from the pole top to a stake toward +X+Z, with a flag of tape ----
    G = B.bone('guy', (0, 0, 0))
    B.obj('guy_line', (bm_rod_open if lo else bm_rod)((0.02, H0 - 0.1, 0.02), (0.95, 0.04, 0.95), 0.011 * B.pick(1, 1.6), B.pick(4, 3)), matte('cable', '#2a2a2e', 0.7), parent=G)
    if not lo: B.obj('guy_stake', bm_rod((0.9, 0.3, 0.9), (1.02, -0.02, 1.02), 0.02, 5), M_pipe, parent=G)
    if not lo: B.obj('guy_flag', bm_box(0.12, 0.08, 0.02, (0.5, H0 * 0.45, 0.5), M=rot(yaw=0.78)), matte('flag', '#ffe24a', 0.6), parent=G)
    # ---- the front string of lights (root `lights`): a sagging wire with ten bulbs ----
    Li = B.bone('lights', (0, 0, 0))
    pts = catenary((-hw, H0 - 0.15, hd + 0.02), (hw, H0 - 0.15, hd + 0.02), 0.3, 9)
    if lo:   # five bulbs on a plain wire: from the middle distance they read as a dotted line of light
        B.obj('wire', bm_tube(pts[::2] + [pts[-1]], 0.012, 3, caps=False), matte('cable', '#2a2a2e', 0.7), parent=Li)
        for i, p in enumerate(pts[1:10:2]): B.obj('bulb_%d' % i, bm_box(0.11, 0.11, 0.11, (p[0], p[1] - 0.05, p[2])), led(NEON[(2 * i + 1) % 7], 3.0), parent=Li)
    else:
        B.obj('wire', bm_tube(pts, 0.008, 4, caps=False), matte('cable', '#2a2a2e', 0.7), parent=Li)
        for i, p in enumerate(pts[:10]):
            B.obj('bulb_%d' % i, bm_ico(0.05, 1, (p[0], p[1] - 0.06, p[2])), led(NEON[i % 7], 3.0), parent=Li)
            B.obj('socket_%d' % i, bm_cyl(0.018, 0.018, 0.04, 6, AY, (p[0], p[1] - 0.01, p[2])), matte('socket', '#1a1a1e'), parent=Li)

def shade_fn(x, y, z, nx, ny, nz, m):
    if m in ('cover', 'hem'):
        if ny > 0.4 and y > H0 - 0.2: return (1.0, 0.99, 0.96)          # sun-bleached top
        if ny < -0.4: return (0.86, 0.85, 0.84)                          # the underside reads a touch darker
    return dusty(0.4, col=(0.86, 0.8, 0.7))(x, y, z, nx, ny, nz, m)

if __name__ == '__main__':
    run_prop('shade', build, bake=dict(ao_dist=0.35, ao_k=0.65, rays=16, shade_fn=shade_fn), max_tris={'hi': 3500, 'lo': 700},
             views=[((0.8, -1, 0.45), 'front'), ((0.7, -1, -0.15), 'under')])
