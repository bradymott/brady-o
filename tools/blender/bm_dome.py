# Burning Man hero prop: a geodesic dome (replaces BurnsProps.dome, authored at r = 5, frequency 2; the game scales it
# by opts.r / 5). A real strut lattice with hub balls, a translucent-looking fabric cover on the lower half with a
# few lit panels, and a dark door (its own root `door`, so the game can place it unscaled at z = r - 0.15).
# Headless:  /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/bm_dome.py
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bmkit import *

R0, FREQ = 5.0, 2
LIT = ['#ff4fd8', '#38f2ff', '#ffe24a']

def build(B):
    L = B.L
    P, faces, edges = geodesic(FREQ, R0)
    rad = max(0.03, R0 * 0.009)
    M_frame = metal('frame', '#d4d4dc', 0.3)
    M_cover = mat('cover', '#e8e0d0', rough=0.6, emit='#e8e0d0', strength=0.5)     # recoloured from opts.col; soft self-glow = backlit fabric
    # struts and hubs (open tubes under icosahedron hubs: the cheapest lattice that still reads as pipes)
    for k, (i, j) in enumerate(edges):
        B.obj('strut_%d' % k, bm_rod_open(P[i], P[j], rad, 6), M_frame)
    for i in sorted({v for e in edges for v in e}):
        B.obj('hub_%d' % i, bm_ico(rad * 1.9, 0, P[i]), M_frame)
    # fabric: the facets whose centroid sits in the lower 55% (two sheets, inset between the struts), lit panels every 7th
    lower = [f for f in faces if (P[f[0]][1] + P[f[1]][1] + P[f[2]][1]) / 3 < R0 * 0.55]
    plain, lit = [], {0: [], 1: [], 2: []}
    for k, f in enumerate(lower):
        (lit[k % 3] if k % 7 == 3 else plain).append(tuple(P[i] for i in f))
    def sheet(tris, name, m):
        s = 0.985
        outer = bm_tri_sheet([tuple(tuple(c * s for c in p) for p in t) for t in tris], inset=0.06)
        inner = flip(bm_tri_sheet([tuple(tuple(c * (s - 0.004) for c in p) for p in t) for t in tris], inset=0.06))
        B.obj(name, merge(outer, inner), m, smooth=False)
    sheet(plain, 'cover', M_cover)
    for k in range(3):
        if lit[k]: sheet(lit[k], 'lit%d' % k, glow('lit%d' % k, LIT[k], strength=2.4, rough=0.5, coat=0.0))
    # a ring of ground stakes / base plates where the lattice meets the playa
    for i in sorted({v for e in edges for v in e}):
        if P[i][1] < 0.01: B.obj('foot_%d' % i, bm_cyl(rad * 2.6, rad * 2.6, 0.05, 8, AY, (P[i][0], 0.025, P[i][2])), matte('foot', '#5a5a62'))
    # the door: a dark rounded slab (root `door`, placed by the game at z = r - 0.15)
    D = B.bone('door', (0, 0, 0))
    B.obj('door_slab', bm_box(1.2, 1.8, 0.3, (0, 0.9, 0)), matte('door', '#2a1a2a', 0.8), parent=D, bevel=0.08, bevel_angle=False)
    B.obj('door_frame', bm_box(1.4, 2.0, 0.1, (0, 1.0, -0.05)), M_frame, parent=D, bevel=0.03, bevel_angle=False)
    B.obj('door_lamp', bm_ico(0.09, 1, (0, 2.1, 0.1)), led('#ffd890', 3.0), parent=D)

if __name__ == '__main__':
    run_static('dome', build, views=[((0.8, -1, 0.5), 'front'), ((-0.9, 0.8, 0.6), 'rear')])
