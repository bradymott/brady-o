# Burning Man prop: a two-pole dome tent (the city's most numerous prop: BurnsProps.domeTent, the `ow_tent` prototype).
# Footprint about 2.7 x 2.3 m, 1.25 m tall, door facing +Z, like the procedural blob it replaces. Built near-white:
# the city tints every copy (green, red, blue, gold, purple, orange), so the fly takes the colour while the dark
# bathtub floor, zips and shadows stay dark. Details that make it read as a real tent at phone size:
# - the fly sags between the two crossing poles (panels bulge, seams sit on the pole arcs) and rides up off the ground
#   at the corners where it is staked out, showing the dark inner tent's bathtub floor below it;
# - pole sleeves (taped seams) along both diagonals, a ridge vent awning at the back, a D-shaped door with its zip
#   track and the door rolled up into a sausage over the opening, the dark mesh inner door;
# - four guy lines to stakes, corner tabs, and a warm lantern clipped by the door (glows at night);
# - baked vertex colour: dust up the lower 40 cm of the fly and floor, AO in the seams, under the vent and roll.
# Levels: hi (near, about 1k triangles), lo (mid, about 250).
# Live Blender:  import runpy; runpy.run_path('<repo>/tools/blender/bm_tent.py', run_name='__main__')
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bmkit import *

A, Bz, H = 1.32, 1.1, 1.25        # footprint half extents (x, z) at the hem and the apex height
HEM = 0.16                         # the fly's hem height at mid-sides (it lifts to ~0.28 at the staked corners)

def foot_r(th):
    """Radius of the rounded-rectangle footprint in direction th (0 = +Z, the door)."""
    s, c = abs(math.sin(th)), abs(math.cos(th)); p = 3.2
    return 1.0 / ((s / A) ** p + (c / Bz) ** p) ** (1 / p)

DIAG = [math.atan2(A, Bz), math.pi - math.atan2(A, Bz), math.pi + math.atan2(A, Bz), -math.atan2(A, Bz)]

def pole_w(th):
    """1 on a pole arc (the diagonals), falling to 0 midway between two poles."""
    w = 0.0
    for d in DIAG:
        dd = abs((th - d + math.pi) % TAU - math.pi)
        w = max(w, max(0.0, 1.0 - dd / (math.pi / 4)))
    return w ** 1.5

def fly_pt(th, rho, inset=0.0):
    """A point on the fly: th around (0 = door side), rho 0 at the apex .. 1 at the hem. Panels sag between poles."""
    w = pole_w(th); R = foot_r(th) * (1 - inset)
    sag = 1.0 - 0.2 * (1 - w) * math.sin(math.pi * min(1, rho * 1.1)) ** 1.3      # panels droop between the arcs
    bulge = 1.0 - 0.05 * (1 - w) * math.sin(math.pi * rho)                     # ...and belly outward a little
    hem = 0.05 + (HEM + 0.1) * (1 - w) ** 0.7                                  # corners staked to the ground, sides scalloped up
    r = R * math.sin(rho * math.pi / 2) ** 0.75 * bulge
    y = hem + (H - hem) * math.cos(rho * math.pi / 2) ** 0.7 * sag
    return (math.sin(th) * r, y, math.cos(th) * r)

def build(B):
    lo = B.lo
    M_fly = mat('fly', '#f6f4f0', rough=0.5)          # satin ripstop: takes the copy's tint
    M_tape = mat('tape', '#d8d6d2', rough=0.55)       # seam tape / sleeves: a shade darker
    M_floor = mat('floor', '#3a3c44', rough=0.8)      # bathtub floor and inner tent
    M_door = mat('door', '#16171c', rough=0.9)        # the open doorway's dark mesh
    M_pole = satin('pole', '#8c8e96', 0.45)
    M_cord = matte('cord', '#e8e4dc', 0.7)
    M_zip = matte('zip', '#24262c', 0.6)
    nu, nv = B.pick((24, 7), (12, 4))
    # ---- the fly: a sagging dome over the footprint ----
    def fly(u, v): return fly_pt(u * TAU, v)
    B.obj('fly', bm_surf(nu, nv, fly, wrap_u=True, merge=True), M_fly)
    # ---- inner tent / bathtub floor: a low dark band just inside the hem, visible under the lifted fly ----
    ring = [(math.sin(t) * foot_r(t) * 0.93, math.cos(t) * foot_r(t) * 0.93) for t in (TAU * k / nu for k in range(nu))]
    rows = [[(x, 0.0, z) for x, z in ring], [(x * 0.985, HEM + 0.14, z * 0.985) for x, z in ring]]
    B.obj('floor', bm_loft(rows, closed_u=True, caps=False), M_floor)
    # ---- pole sleeves (the two crossing arcs, taped seams standing slightly proud) ----
    n_arc = B.pick(10, 5)
    for k, d in enumerate(DIAG[:2]):
        pts = [fly_pt(d, 1 - i / n_arc, -0.012) for i in range(n_arc + 1)] + [fly_pt(d + math.pi, i / n_arc, -0.012) for i in range(1, n_arc + 1)]
        pts = [(x, y + 0.008, z) for x, y, z in pts]
        B.obj('sleeve_%d' % k, bm_tube(pts, 0.022, 3, caps=False), M_tape)
        if not lo:   # the pole ends in their grommet feet at the staked corners
            for e in (pts[0], pts[-1]):
                B.obj('pole_foot_%d_%d' % (k, e is pts[0]), bm_rod((e[0], e[1], e[2]), (e[0] * 1.03, 0.02, e[2] * 1.03), 0.014, 4), M_pole)
    # ---- the door: D-shaped dark opening on +Z, its zip track, the rolled door over it ----
    zd = foot_r(0)
    def door_pt(t, s=1.0, push=0.0):
        # t 0..1 around the D (from the bottom left, over the arch, to the bottom right); s scales it
        a = math.pi * t; x = -math.cos(a) * 0.5 * s; yy = 0.06 + math.sin(a) * 0.7 * s
        rho = None
        # project onto the fly: find the fly point under (x, yy) on the door side
        th = math.atan2(x, zd); lo_r, hi_r = 0.0, 1.0
        for _ in range(18):
            mid = (lo_r + hi_r) / 2
            if fly_pt(th, mid)[1] > yy: lo_r = mid
            else: hi_r = mid
        p = fly_pt(th, (lo_r + hi_r) / 2)
        return (p[0] * (1 + push), p[1], p[2] * (1 + push))
    nd = B.pick(10, 5)
    rim = [door_pt(i / nd, 1.0, 0.032) for i in range(nd + 1)]
    inner = [door_pt(i / nd, 0.9, 0.006) for i in range(nd + 1)]
    # the opening: rows of the D shrunk toward its bottom centre, each projected onto the fly (so it hugs the curve)
    rows = [[door_pt(i / nd, k, 0.03) for i in range(nd + 1)] for k in B.pick((1.0, 0.7, 0.4, 0.08), (1.0, 0.5, 0.08))]
    bmo = bmesh.new(); RV = [[bmo.verts.new(E(*p)) for p in row] for row in rows]
    for a_, b_ in zip(RV, RV[1:]):
        for i in range(nd): bmo.faces.new((a_[i], a_[i + 1], b_[i + 1], b_[i]))
    bmo.normal_update()
    if sum(f.normal.dot(E(0, 0, 1)) for f in bmo.faces) < 0: bmesh.ops.reverse_faces(bmo, faces=bmo.faces)
    B.obj('door', bmo, M_door)
    if not lo:
        B.obj('zip', bm_tube([(p[0], p[1] + 0.004, p[2] + 0.008) for p in rim], 0.014, 4, caps=False), M_zip)
        # the door rolled up and tied over the opening
        top = door_pt(0.5, 1.0, 0.03)
        B.obj('door_roll', bm_capsule(0.065, 0.62, 8, 3, (0, top[1] + 0.06, top[2] + 0.04), AX), M_fly)
        for sx in (-0.18, 0.18): B.obj('tie_%d' % (sx > 0), bm_torus(0.07, 0.008, 8, 3, AX, (sx, top[1] + 0.06, top[2] + 0.04)), M_cord)
    else:
        top = door_pt(0.5, 1.0, 0.03)
        B.obj('door_roll', bm_cyl(0.06, 0.06, 0.6, 5, AX, (0, top[1] + 0.06, top[2] + 0.04)), M_fly)
    # ---- the vent awning at the back, near the top ----
    vb = fly_pt(math.pi, 0.32, -0.01)
    B.obj('vent', bm_box(0.5, 0.05, 0.22, (vb[0], vb[1] + 0.06, vb[2] - 0.08), M=rot(pitch=-0.45)), M_fly, bevel=B.pick(0.02, None), bevel_angle=False)
    if not lo:
        B.obj('vent_dark', bm_box(0.42, 0.1, 0.02, (vb[0], vb[1] + 0.0, vb[2] - 0.17), M=rot(pitch=-0.2)), M_door)
    # ---- guy lines, stakes and corner tabs ----
    if not lo:
        for k, d in enumerate(DIAG):
            p = fly_pt(d, 0.62, -0.01); g = (math.sin(d) * (foot_r(d) + 0.75), 0.02, math.cos(d) * (foot_r(d) + 0.75))
            B.obj('guy_%d' % k, bm_rod(p, g, 0.006, 3), M_cord)
            B.obj('stake_%d' % k, bm_rod((g[0], -0.05, g[2]), (g[0] * 1.02, 0.09, g[2] * 1.02), 0.012, 4), M_pole)
            B.obj('loop_%d' % k, bm_ico(0.022, 1, p), M_tape)
            h = fly_pt(d, 1.0, -0.02)
            B.obj('tab_%d' % k, bm_rod((h[0], h[1], h[2]), (h[0] * 1.08, 0.03, h[2] * 1.08), 0.01, 3), M_zip)
    # ---- the lantern clipped to the door's right side (glows at night) ----
    lp = door_pt(0.22, 1.12, 0.05)
    B.obj('lantern', bm_capsule(0.06, 0.16, B.pick(8, 5), B.pick(3, 2), (lp[0] + 0.05, lp[1] - 0.05, lp[2] + 0.06)), led('#ffe0b0', 3.0))
    if not lo: B.obj('lantern_cap', bm_cyl(0.05, 0.035, 0.04, 8, AY, (lp[0] + 0.05, lp[1] + 0.05, lp[2] + 0.06)), M_zip)

def shade(x, y, z, nx, ny, nz, m):
    # playa dust up the lowest 45 cm (and in the floor), a touch of bleaching on the sunny top of the fly
    d = dusty(0.45, col=(0.86, 0.8, 0.7))(x, y, z, nx, ny, nz, m)
    if m == 'fly' and ny > 0.6: return (d[0] * 1.0, d[1] * 0.99, d[2] * 0.96)
    return d

if __name__ == '__main__':
    run_prop('tent', build, bake=dict(ao_dist=0.35, ao_k=0.7, rays=16, shade_fn=shade), max_tris={'hi': 1400, 'lo': 320}, views=[('front', 'front'), ((0.9, 0.9, 0.5), 'rear')])
