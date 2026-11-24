# Burning Man prop: a pickup with a camper shell (replaces BurnsProps.camper: 6.2 x 2.2 m, shell roof 2.75, front +Z).
# A rounded pickup (hood, cab, chrome grille and bumpers, glass, mirrors) and a fibreglass camper shell over the bed
# with soft edges, a raised roof line, sliding side windows (one lit warm at night), a rear hatch with its glass, a roof
# rack with a cargo box and a sun-faded tarp, mud flaps. Materials `truck` and `shell` are recoloured per seed.
# Levels: hi (near) and lo (mid). Live Blender:  import runpy; runpy.run_path('<repo>/tools/blender/bm_camper.py', run_name='__main__')
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bmkit import *

L_, W = 6.2, 2.2
ZF, ZB = L_ / 2, -L_ / 2
SZ0, SZ1 = ZB + 0.05, ZF - 2.95          # the shell's back and front

def build(B):
    lo = B.lo; slim(B, keep={'cab', 'hood', 'bed', 'shell'})
    M_truck = paint('truck', '#a83a2a', coat=0.6, rough=0.3, metal=0.1)
    M_shell = paint('shell', '#e8e4dc', coat=0.3, rough=0.4, metal=0.0)
    M_glass = metal('glass', '#1a2232', 0.12); M_lit = led('#ffc070', 2.6)
    M_dark = matte('dark', '#22232a'); M_chrome = chrome(); M_tyre = rubber(); M_rim = metal('rim', '#c8ccd4', 0.2)
    # ---- the pickup ----
    B.obj('frame', bm_box(1.8, 0.28, L_ - 0.4, (0, 0.45, 0)), M_dark)
    B.obj('hood', bm_box(W - 0.05, 0.62, 1.6, (0, 0.95, ZF - 0.8)), M_truck, bevel=0.22, bevel_angle=False)
    B.obj('cab', bm_box(W - 0.08, 1.3, 1.4, (0, 1.3, ZF - 2.3)), M_truck, bevel=0.3, bevel_angle=False)
    B.obj('bed', bm_box(W, 0.62, SZ1 - SZ0, (0, 0.95, (SZ0 + SZ1) / 2)), M_truck, bevel=0.1, bevel_angle=False)
    B.obj('screen', bm_box(W - 0.4, 0.5, 0.04, (0, 1.65, ZF - 1.6), M=rot(pitch=-0.35)), M_glass, bevel=0.03)
    for s in (1, -1): B.obj('side_glass_%d' % (s > 0), bm_box(0.03, 0.42, 0.95, (s * (W / 2 - 0.03), 1.68, ZF - 2.3)), M_glass, bevel=0.03)
    B.obj('grille', bm_box(1.4, 0.34, 0.05, (0, 0.95, ZF + 0.01)), M_chrome, bevel=0.03)
    for z in (ZF + 0.06, ZB - 0.04): B.obj('bumper_%d' % (z > 0), bm_box(W, 0.2, 0.16, (0, 0.55, z)), M_chrome, bevel=0.06)
    for s in (1, -1):
        B.obj('head_%d' % (s > 0), bm_box(0.3, 0.16, 0.04, (s * 0.7, 1.0, ZF + 0.02)), lens(), bevel=0.02)
        B.obj('tail_%d' % (s > 0), bm_box(0.12, 0.28, 0.04, (s * 0.95, 1.0, ZB + 0.0)), led('#ff2a2a', 2.5))
        if not lo:
            B.obj('mirror_%d' % (s > 0), bm_box(0.06, 0.2, 0.15, (s * (W / 2 + 0.16), 1.6, ZF - 1.75)), M_dark, bevel=0.02)
            B.obj('flap_%d' % (s > 0), bm_box(0.03, 0.3, 0.25, (s * (W / 2 - 0.15), 0.3, ZB + 0.75)), M_dark)
    for z in (ZF - 1.0, ZB + 1.2):
        for s in (1, -1):
            B.obj('tyre_%d_%d' % (z > 0, s > 0), bm_cyl(0.42, 0.42, 0.28, B.pick(12, 8), AX, (s * (W / 2 - 0.16), 0.42, z)), M_tyre, bevel=0.08)
            if not lo: B.obj('rim_%d_%d' % (z > 0, s > 0), bm_cyl(0.23, 0.23, 0.3, 10, AX, (s * (W / 2 - 0.16), 0.42, z)), M_rim)
    # ---- the camper shell: a soft box, a little wider than the bed, its roof rising toward the cab ----
    sh = bm_box(W + 0.15, 1.5, SZ1 - SZ0 + 0.2, (0, 2.0, (SZ0 + SZ1) / 2 + 0.05))
    for v in sh.verts:   # raise the front of the roof (engine y is Blender z; engine z forward is Blender -y)
        if v.co.z > 2.2 and -v.co.y > (SZ0 + SZ1) / 2: v.co.z += 0.12
    B.obj('shell', sh, M_shell, bevel=0.28, bevel_angle=False)
    # sliding windows a side, the rear hatch glass, the front window over the cab
    zc = (SZ0 + SZ1) / 2
    for s in (1, -1):
        B.obj('swin_%d' % (s > 0), bm_box(0.04, 0.5, 1.6, (s * ((W + 0.15) / 2 + 0.005), 2.15, zc + 0.1)), M_lit if s > 0 else M_glass, bevel=0.08, bevel_angle=False)
        if not lo: B.obj('swin_bar_%d' % (s > 0), bm_box(0.05, 0.5, 0.04, (s * ((W + 0.15) / 2 + 0.01), 2.15, zc + 0.1)), M_dark)
    B.obj('hatch', bm_box(1.6, 0.8, 0.04, (0, 2.1, SZ0 - 0.05)), M_glass, bevel=0.06, bevel_angle=False)
    if not lo:
        B.obj('hatch_handle', bm_box(0.3, 0.05, 0.04, (0, 1.68, SZ0 - 0.08)), M_chrome)
        # roof rack: two bars, a cargo box, a tarp-wrapped bundle
        for z in (zc - 0.7, zc + 0.6): B.obj('bar_%d' % (z > zc), bm_box(W, 0.05, 0.06, (0, 2.84, z)), M_dark)
        B.obj('cargo', bm_box(0.9, 0.35, 1.4, (0.35, 3.05, zc - 0.05)), satin('cargo', '#2a2c34', 0.5), bevel=0.1, bevel_angle=False)
        B.obj('tarp', bm_ellipsoid(0.35, 0.22, 0.6, 10, 5, (-0.6, 3.0, zc)), mat('tarp', '#3a6a8a', rough=0.8))
        B.obj('strap', bm_box(0.04, 0.02, 1.3, (-0.6, 3.21, zc)), matte('strap', '#d8a020', 0.6))

def shade(x, y, z, nx, ny, nz, m):
    r, g, b = dusty(0.8, col=(0.84, 0.76, 0.64))(x, y, z, nx, ny, nz, m)
    if m == 'tarp' and ny > 0.3: r, g, b = r * 1.0, g * 1.03, b * 1.06   # sun-faded
    return min(1, r), min(1, g), min(1, b)

if __name__ == '__main__':
    run_prop('camper', build, bake=dict(ao_dist=0.4, ao_k=0.6, rays=12, shade_fn=shade), max_tris={'hi': 3500, 'lo': 800},
             views=[((0.9, -0.7, 0.35), 'front'), ((-0.9, 0.7, 0.35), 'rear')])
