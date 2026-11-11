# Calamari Inferno (Art Cart car #3): a riveted steampunk copper octopus on a glossy oxblood steam-wagon; eight arms,
# every one of them breathes fire.
# Run it inside an open Blender (Blender 5.2 crashes headless on Brady's Mac):
#   import runpy; runpy.run_path('/abs/path/tools/blender/calamari_inferno.py', run_name='__main__')
# Writes assets/models/art-cart/calamari_inferno.glb (showroom, <= 30k tris) and calamari_inferno_lo.glb (race, <= 7k).
#
# Rig (rigV 3, posed by CART_GLB_PARTS['octo:3'] in src/43_cart_bb_glb.js; rigV 2 had sculpted mesh flames):
#   part_head          the copper mantle (porthole eyes, brows, hatch, chimney), joint HEAD: it bobs and looks around
#   part_arm0..arm7    the eight arms, each authored pointing along +Z from its root joint (the pose yaws it to
#                      (i + 0.5) / 8 of a turn, as the procedural car does); each curls (pitch + a squash that tightens
#                      the curl), waves sideways (roll) and lifts when firing. The burner at the tip rides on its arm;
#                      body extra.flames = [FLAME_AT, FLAME_DIR] tells the game where to draw the live fire.
# body extras: rigV = 3, extra.sight = the mantle's top (the chase camera rises just enough to see over it), chimney.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cartkit import *

COL, COL2, LIGHT = '#c8743a', '#ffd06a', '#ff8a2a'   # CART_CARS.octo palette: copper, brass, flame
HEAD = (0, 2.35, 0.55)       # the head bone's pivot (lowered 0.4 m from the first build so the chase camera sees more road)
HULL_Y = 0.72
ARM_R0 = (1.05, 1.1)         # arm roots: x = sin(a) * 1.05, z = 0.55 + cos(a) * 1.1, y = 1.55
# the arm's spine, part-local (+Z out from the body, Y up): out and down to the ground, then the tip curls up into a torch
ARM_CTRL = [(0, 0, 0), (0, -0.1, 0.42), (0, -0.4, 0.86), (0, -0.74, 1.2), (0, -0.9, 1.52), (0, -0.82, 1.8), (0, -0.58, 1.92), (0, -0.36, 1.86)]

def hull_ring(z, w, h, r, seg, yc=HULL_Y, splits=(0.6,)):
    """A rounded-rectangle section of the hull at z with extra points at the heights in `splits` (absolute y)."""
    pts = rrect_pts(w, h, r, seg); out = []
    lo_y, hi_y = -h / 2 + r + 0.004, h / 2 - r - 0.004
    ys = sorted(min(hi_y, max(lo_y, s - yc)) for s in splits)
    for i, (x, y) in enumerate(pts):
        out.append((x, y)); nx, ny = pts[(i + 1) % len(pts)]
        if abs(x - w / 2) < 1e-6 and abs(nx - w / 2) < 1e-6 and ny > y: out += [(w / 2, s) for s in ys if y < s < ny]
        if abs(x + w / 2) < 1e-6 and abs(nx + w / 2) < 1e-6 and ny < y: out += [(-w / 2, s) for s in reversed(ys) if ny < s < y]
    return [(x, yc + y, z) for x, y in out]

def ell_pt(c, R, a, ph, k=1.0):
    """A point on the mantle ellipsoid (centre c, radii R) at azimuth a (0 = forward) and polar angle ph (0 = top), scaled k."""
    return (c[0] + math.sin(a) * math.sin(ph) * R[0] * k, c[1] + math.cos(ph) * R[1] * k, c[2] + math.cos(a) * math.sin(ph) * R[2] * k)
def ell_n(c, R, p):
    n = Vector(((p[0] - c[0]) / R[0] ** 2, (p[1] - c[1]) / R[1] ** 2, (p[2] - c[2]) / R[2] ** 2)); n.normalize(); return n

def arm_at(u):
    """Point and unit tangent of the arm spine at u in 0..1 (part-local engine vectors)."""
    p = Vector(catmull_at(ARM_CTRL, u)); q = Vector(catmull_at(ARM_CTRL, min(1.0, u + 0.01))) - Vector(catmull_at(ARM_CTRL, max(0.0, u - 0.01)))
    return p, q.normalized()
def arm_r(u): return 0.25 - 0.17 * u ** 0.9

def flame_tip():
    """Where the flame sits (part-local) and which way it points: off the end of the curled tip."""
    p, t = arm_at(1.0); return p + t * 0.12, t

_C, _T = arm_at(1.0)
FLAME_AT, FLAME_DIR = tuple(_C + _T * 0.1), tuple(_T)   # the flame's root (part-local, every arm) and its nozzle direction

def build(B):
    L = B.L; lo = B.lo
    B.export_try = VCOL_EXPORT
    # ---- materials: polished copper and brass, an oxblood clear-coat wagon, dark iron, warm glows ----
    M_cu = metal('copper', COL, 0.18); M_cu2 = metal('copper_dark', '#9a5228', 0.24); M_cu3 = metal('copper_deep', '#7a3e1c', 0.3)
    M_br = metal('brass', COL2, 0.12); M_br2 = metal('brass_dark', '#b8863a', 0.2)
    M_fe = metal('iron', '#2e2622', 0.5); M_fe2 = metal('iron_dark', '#1c1614', 0.6)
    M_paint = paint('oxblood', '#5a1a10', coat=1.0, rough=0.2, metal=0.35); M_sill = paint('wagon_black', '#140d0a', coat=1.0, rough=0.22, metal=0.2)
    M_eye = glow('eye_glow', '#ff9a2a', strength=2.4, rough=0.2); M_pupil = mat('pupil', '#1a0a04', rough=0.15, coat=1.0)
    M_gauge = glow('gauge_glow', '#ffe6a0', strength=1.2, rough=0.2); M_suck = paint('sucker', '#e8a27a', coat=1.0, rough=0.25, metal=0.1)
    # the burner glows: a white-hot ember core in each nozzle and an orange heat ring at its lip
    M_core, M_heat = led('#fff2c8', 5.0), glow('heat_ring', '#ff7a1a', strength=3.0, rough=0.4, coat=0.0)
    def rivet(name, p, r=0.045, parent=None, m=M_br):
        if lo: return
        B.obj(name, bm_ico(r, 0, p), m, parent=parent)

    # ---- the wagon: lofted rounded hull, oxblood over a black sill, brass shoulder trim, wheel arches with brass flares ----
    cs = B.pick(6, 3)
    rings = [hull_ring(2.55, 1.86, 0.36, 0.16, cs, yc=0.74), hull_ring(2.46, 2.2, 0.54, 0.22, cs), hull_ring(2.3, 2.4, 0.64, 0.24, cs)]
    if not lo: rings += [hull_ring(0.0, 2.42, 0.66, 0.24, cs)]
    rings += [hull_ring(-2.3, 2.4, 0.64, 0.24, cs), hull_ring(-2.46, 2.2, 0.54, 0.22, cs), hull_ring(-2.55, 1.86, 0.36, 0.16, cs, yc=0.74)]
    shell = B.obj('hull', bm_loft(rings, closed_u=True, caps=True), [M_paint, M_sill], face_mat=lambda f: 1 if f.calc_center_median().z < 0.6 else 0)
    B.vcol(shell, lambda x, y, z: (lambda k: (1.0 * k, 0.86 * k + 0.1, 0.8 * k + 0.12))(0.78 + 0.22 * sstep((y - 0.5) / 0.5)))   # glossier, warmer at the shoulder
    for i, (x, z) in enumerate([(1.1, 1.7), (-1.1, 1.7), (1.1, -1.7), (-1.1, -1.7)]):
        B.cut([shell], bm_cyl(0.64, 0.64, 0.9, L['arch'], AX, (math.copysign(1.32, x), 0.5, z)), 'arch_%d' % i)
        B.obj('flare_%d' % i, bm_torus(0.655, 0.038, B.pick(18, 8), B.pick(4, 3), AX, (math.copysign(1.215, x), 0.5, z), sweep=(math.pi / 2, 3 * math.pi / 2)), M_br)
    for s in (1, -1):
        B.obj('shoulder_%d' % (s > 0), bm_tube(catmull([(s * 0.96, 1.0, 2.5), (s * 1.19, 1.04, 1.95), (s * 1.21, 1.04, -1.95), (s * 0.96, 1.0, -2.5)], B.pick(12, 4)), 0.024, B.pick(8, 4)), M_br)
        B.strip((s * 1.19, 0.44, 2.15), (s * 1.19, 0.44, -2.15), LIGHT, th=0.04)
        B.light(s * 1.05, 0.25, 0.0, 2.4, LIGHT, led=1)
    B.strip((-0.9, 0.44, 2.54), (0.9, 0.44, 2.54), LIGHT, th=0.035); B.strip((-0.9, 0.44, -2.54), (0.9, 0.44, -2.54), LIGHT, th=0.035)
    # brass deck plate with rivet rows
    B.obj('deck', bm_softbox(2.2, 0.08, 4.6, B.pick(28, 14), B.pick(6, 4), (0, 1.05, -0.05), p=6.0), M_br2)
    if not lo:
        for s in (1, -1):
            for k in range(6): rivet('deck_rv_%d_%d' % (s > 0, k), (s * 1.02, 1.085, -2.2 + k * 0.84), 0.035)
    # front cowcatcher (brass rails and angled bars) and a brass tube bumper at the back
    B.obj('cow_rail', bm_tube(catmull([(-1.05, 0.72, 2.45), (-0.8, 0.72, 2.58), (0.8, 0.72, 2.58), (1.05, 0.72, 2.45)], B.pick(12, 5)), 0.04, B.pick(8, 5)), M_br)
    if not lo: B.obj('cow_rail2', bm_rod((-0.55, 0.24, 2.84), (0.55, 0.24, 2.84), 0.035, L['rod']), M_br)
    nb = B.pick(7, 3)
    for k in range(nb):
        x = -0.9 + 1.8 * k / (nb - 1)
        B.obj('cow_bar_%d' % k, bm_rod((x, 0.72, 2.58 - 0.1 * abs(x)), (x * 0.55, 0.22, 2.85), 0.03, L['rod']), M_br)
    B.obj('bumper_rear', bm_tube(catmull([(1.15, 0.58, -2.2), (1.02, 0.58, -2.56), (0.6, 0.58, -2.68), (-0.6, 0.58, -2.68), (-1.02, 0.58, -2.56), (-1.15, 0.58, -2.2)], B.pick(16, 7)), 0.06, B.pick(8, 6)), M_br)

    # ---- the boiler drum under the head: iron, brass bands, rivets, a pressure gauge, valve wheels ----
    B.obj('boiler', bm_cyl(0.95, 0.95, 0.62, L['cyl'], AY, (0, 1.2, 0.55)), M_fe, bevel=0.05)
    for k, y in enumerate((0.96, 1.44)):
        B.obj('boiler_band_%d' % k, bm_torus(0.95, 0.045, B.pick(22, 10), B.pick(4, 3), AY, (0, y, 0.55)), M_br)
    if not lo:
        for k in range(12):
            a = k / 12 * TAU; rivet('boiler_rv_%d' % k, (math.sin(a) * 0.96, 1.2, 0.55 + math.cos(a) * 0.96))
    B.obj('neck', bm_cyl(0.82, 0.78, 0.4, L['cyl_s'], AY, (0, 1.65, 0.55)), M_cu2)
    B.obj('collar', bm_torus(1.04, 0.09, B.pick(28, 10), B.pick(6, 4), AY, (0, 1.55, 0.55)), M_br)
    gp = (0, 1.2, 1.5)
    B.obj('gauge_rim', bm_torus(0.2, 0.03, B.pick(20, 10), B.pick(5, 4), AZ, gp), chrome())
    B.obj('gauge_face', bm_cyl(0.19, 0.19, 0.05, B.pick(20, 10), AZ, gp), M_gauge)
    if not lo:
        B.obj('gauge_needle', bm_rod((0, 1.2, 1.54), (0.1, 1.32, 1.54), 0.012, 5), M_fe2)
        B.obj('gauge_hub', bm_ico(0.025, 1, (0, 1.2, 1.54)), chrome())
    # copper steam pipes along the deck to flared exhaust stacks at the rear corners (glowing embers in their bores)
    for s in (1, -1):
        B.obj('pipe_%d' % (s > 0), bm_tube(catmull([(s * 0.5, 1.2, 0.0), (s * 0.95, 1.16, -0.3), (s * 1.0, 1.15, -1.2), (s * 1.0, 1.15, -2.05), (s * 1.0, 1.4, -2.25), (s * 1.0, 1.75, -2.25)], B.pick(14, 6)), 0.055, B.pick(8, 5)), M_cu)
        B.obj('stack_flare_%d' % (s > 0), bm_closed_lathe([(0, 0.0), (0.06, 0.0), (0.075, 0.08), (0.11, 0.18), (0.08, 0.17), (0.0, 0.1)], B.pick(14, 8), AY, (s * 1.0, 1.72, -2.25)), M_br)
        B.obj('stack_ember_%d' % (s > 0), bm_cyl(0.075, 0.075, 0.02, B.pick(12, 6), AY, (s * 1.0, 1.83, -2.25)), led('#ff6a1a', 4.0))
        B.light(s * 1.0, 1.9, -2.25, 0.6, LIGHT, led=1)
    # brass-ringed headlamps, glowing tail lamps
    for s in (1, -1):
        hx = s * 0.78
        B.obj('head_cup_%d' % (s > 0), bm_closed_lathe([(0, -0.08), (0.15, -0.06), (0.16, 0.0), (0.0, 0.01)], L['cyl_s'], AZ, (hx, 0.86, 2.53)), M_fe)
        B.obj('head_bezel_%d' % (s > 0), bm_torus(0.155, 0.03, B.pick(16, 10), B.pick(4, 3), AZ, (hx, 0.86, 2.545)), M_br)
        B.obj('head_lens_%d' % (s > 0), bm_ellipsoid(0.13, 0.035, 0.13, L['cyl_s'], B.pick(5, 2), (hx, 0.86, 2.54), phi1=math.pi / 2, M=AZ), led('#fff0d8'))
        B.light(hx, 0.86, 2.68, 1.3, '#fff2c8', head=1)
        B.obj('tail_ring_%d' % (s > 0), bm_torus(0.1, 0.022, B.pick(12, 8), 3, AZn, (s * 0.7, 0.86, -2.6)), M_br)
        B.obj('tail_%d' % (s > 0), bm_ellipsoid(0.085, 0.03, 0.085, L['cyl_s'], B.pick(4, 2), (s * 0.7, 0.86, -2.595), phi1=math.pi / 2, M=AZn), led('#ff2a1a'))
        B.light(s * 0.7, 0.86, -2.7, 0.9, '#ff2a3a', tail=1)

    # ---- the head (mantle, part_head): copper with a deepening patina, brass bands, rivets, porthole eyes, chimney ----
    H = B.part('head', HEAD)
    hc, hr = (0, 0.35, -0.2), (1.22, 1.38, 1.32)
    mantle = B.obj('mantle', bm_ellipsoid(*hr, B.pick(24, 14), B.pick(14, 9), hc), M_cu, parent=H)
    B.vcol(mantle, lambda x, y, z: (lambda t: (0.62 + 0.38 * t, 0.5 + 0.5 * t, 0.46 + 0.54 * t))(sstep((y + 0.6) / 2.0)))
    B.obj('mantle_skirt', bm_ellipsoid(1.05, 0.45, 1.05, B.pick(24, 12), B.pick(6, 4), (0, -0.5, 0.05), phi0=math.pi / 2), M_cu3, parent=H)
    B.obj('skirt_rim', bm_torus(1.05, 0.05, B.pick(28, 12), B.pick(5, 4), AY, (0, -0.5, 0.05)), M_br, parent=H)
    for k, ph in enumerate((0.82, 1.28)):
        B.obj('mantle_band_%d' % k, bm_torus(hr[0] * math.sin(ph) + 0.005, 0.035, B.pick(24, 12), B.pick(4, 3), AY, (0, hc[1] + hr[1] * math.cos(ph), hc[2]), sy=hr[2] / hr[0]), M_br, parent=H)
    for s in ((1, -1) if not lo else ()):
        x = s * 0.5; q = math.sqrt(1 - (x / hr[0]) ** 2)
        B.obj('mantle_seam_%d' % (s > 0), bm_torus(hr[1] * q, 0.03, 14, 4, AX, (x, hc[1], hc[2]), sweep=(math.pi / 2 + 0.15, 3 * math.pi / 2 - 0.55), sy=hr[2] / hr[1]), M_br, parent=H)
    if not lo:
        for r in range(2):
            n = 11; ph = 0.62 + r * 0.5
            for i in range(n):
                a = (i + 0.5 * (r % 2)) / n * TAU
                rivet('mantle_rv_%d_%d' % (r, i), ell_pt(hc, hr, a, ph, 1.012), parent=H)
    # porthole eyes: brass flange, rim and bolts, a warm glowing lens, a dark pupil, a highlight; a stern brass brow above each
    for s in (1, -1):
        p = (s * 0.6, 0.05, 0.95); n = ell_n(hc, hr, p); nn = tuple(n); P = Vector(p)
        def off(k): return tuple(P + n * k)
        if not lo: B.obj('eye_flange_%d' % (s > 0), bm_cyl(0.37, 0.37, 0.06, 18, aim(nn), off(-0.02)), M_br2, parent=H)
        B.obj('eye_rim_%d' % (s > 0), bm_torus(0.3, 0.07, B.pick(18, 10), B.pick(5, 4), aim(nn), off(0.03)), M_br, parent=H)
        B.obj('eye_lens_%d' % (s > 0), bm_cyl(0.27, 0.25, 0.12, B.pick(22, 10), aim(nn), off(0.02)), M_eye, parent=H)
        B.obj('eye_pupil_%d' % (s > 0), bm_ellipsoid(0.1, 0.05, 0.14, B.pick(12, 8), B.pick(6, 4), tuple(P + n * 0.1 + Vector((s * 0.03, 0, 0))), M=aim(nn)), M_pupil, parent=H)
        u = Vector((0, 1, 0)).cross(n); u.normalize(); v = n.cross(u)
        if not lo:
            B.obj('eye_hl_%d' % (s > 0), bm_uv(0.035, 8, 4, tuple(P + n * 0.12 + u * (-0.07 * s) + v * 0.09)), led('#ffffff', 3.0), parent=H)
            for k in range(6):
                a = k / 6 * TAU
                rivet('eye_bolt_%d_%d' % (s > 0, k), tuple(P + (u * math.cos(a) + v * math.sin(a)) * 0.36), 0.035, parent=H)
        # the brow: a brass arc over the porthole, tilted down toward the nose (a fierce look)
        brow = [tuple(P + n * 0.1 + u * (math.cos(t) * 0.42) + v * (math.sin(t) * 0.42 + 0.06 - 0.12 * s * math.cos(t) * 0.0) + v * (0.06 * s * math.cos(t))) for t in (math.pi * (0.18 + 0.64 * k / 8) for k in range(9))]
        B.obj('brow_%d' % (s > 0), bm_tube(brow, [0.03, 0.045, 0.055, 0.06, 0.06, 0.06, 0.055, 0.045, 0.03], B.pick(8, 4)), M_br, parent=H)
    # a brass hatch with a valve wheel on the crown
    hp = (0, 1.56, 0.45); hn = ell_n(hc, hr, hp); HP = Vector(hp)
    B.obj('hatch', bm_cyl(0.3, 0.28, 0.08, B.pick(20, 10), aim(tuple(hn)), tuple(HP + hn * 0.02)), M_br2, parent=H)
    if not lo:
        B.obj('hatch_wheel', bm_torus(0.16, 0.025, 16, 5, aim(tuple(hn)), tuple(HP + hn * 0.13)), M_br, parent=H)
        B.obj('hatch_stem', bm_rod(tuple(HP + hn * 0.04), tuple(HP + hn * 0.14), 0.03, L['rod']), M_br2, parent=H)
        u = Vector((1, 0, 0)); v = hn.cross(u)
        for k in range(4):
            a = k / 4 * TAU
            B.obj('hatch_spoke_%d' % k, bm_rod(tuple(HP + hn * 0.13), tuple(HP + hn * 0.13 + (u * math.cos(a) + v * math.sin(a)) * 0.15), 0.012, 5), M_br, parent=H)
    # the chimney (puffs smoke in the game at HEAD + c1 = extra.chimney), with a glowing ember bore
    c0, c1 = (0, 1.35, -0.5), (0, 1.85, -0.68)
    cd = Vector(c1) - Vector(c0); cd.normalize()
    B.obj('chimney', bm_rod(c0, c1, 0.15, B.pick(16, 8), r1=0.17), M_fe, parent=H)
    B.obj('chimney_flare', bm_closed_lathe([(0, -0.06), (0.17, -0.06), (0.24, 0.08), (0.2, 0.08), (0.0, 0.0)], B.pick(16, 8), aim(tuple(cd)), tuple(Vector(c1) - cd * 0.02)), M_fe, parent=H)
    B.obj('chimney_cap', bm_torus(0.235, 0.032, B.pick(16, 8), B.pick(5, 4), aim(tuple(cd)), tuple(Vector(c1) + cd * 0.06)), M_br, parent=H)
    B.obj('chimney_ember', bm_cyl(0.16, 0.16, 0.02, B.pick(14, 6), aim(tuple(cd)), tuple(Vector(c1) + cd * 0.03)), led('#ff6a1a', 4.0), parent=H)
    if not lo:
        B.obj('chimney_band', bm_torus(0.165, 0.028, 16, 5, aim(tuple(cd)), tuple(Vector(c0) + cd * 0.28)), M_br, parent=H)
    B.obj('chimney_base', bm_cyl(0.24, 0.17, 0.1, B.pick(16, 8), aim(tuple(cd)), tuple(Vector(c0) + cd * 0.08)), M_br2, parent=H)
    B.light(0, HEAD[1] + 0.05, 1.5, 2.4, '#ff9a2a', big=1)

    # ---- eight arms (part_arm0..7), all authored along +Z; the pose yaws each into place ----
    seg = B.pick(10, 6); n_path = B.pick(16, 9)
    us = [i / (n_path - 1) for i in range(n_path)]
    path = [tuple(arm_at(u)[0]) for u in us]
    radii = [arm_r(u) for u in us]
    fp, ft = flame_tip()
    for i in range(8):
        a = (i + 0.5) / 8 * TAU
        J = (math.sin(a) * ARM_R0[0], 1.55, 0.55 + math.cos(a) * ARM_R0[1])
        A = B.part('arm%d' % i, J)
        # a brass socket on the body where the arm emerges
        B.obj('socket_%d' % i, bm_cyl(0.31, 0.28, 0.16, B.pick(10, 6), aim((math.sin(a), 0, math.cos(a))), (math.sin(a) * 0.97, 1.55, 0.55 + math.cos(a) * 1.02)), M_br)
        # the tapered copper arm: a smooth swept tube, a little flattened underneath, warm copper fading darker to the tip
        arm = B.obj('arm%d_tube' % i, bm_tube(path, radii, seg, section_fn=lambda u: (1.0, 0.88)), M_cu, parent=A)
        B.vcol(arm, lambda x, y, z: (lambda t: (1.0 - 0.12 * t, 0.97 - 0.22 * t, 0.92 - 0.3 * t))(sstep((z - 0.3) / 1.4)))
        # brass rings and, on the showroom car, cream sucker pads down the underside
        for k, u in enumerate(B.pick((0.3, 0.6), ())):
            C, T = arm_at(u)
            B.obj('arm%d_ring%d' % (i, k), bm_torus(arm_r(u) + 0.008, 0.032, B.pick(14, 8), 3, aim(tuple(T)), tuple(C)), M_br, parent=A)
        if not lo:
            for k, u in enumerate((0.36, 0.48, 0.6, 0.71, 0.81)):
                C, T = arm_at(u); D = Vector((0, -1, 0)); D = (D - T * D.dot(T)).normalized(); r = arm_r(u)
                rs = 0.075 - 0.007 * k
                B.obj('arm%d_suck%d' % (i, k), bm_closed_lathe([(0, 0.0), (rs, 0.0), (rs * 1.05, 0.03), (rs * 0.6, 0.04), (0.0, 0.02)], 7, aim(tuple(D)), tuple(C + D * (r * 0.84))), M_suck, parent=A)
        # the torch at the tip: a flared brass nozzle and three nested flame tongues (white core, gold, orange)
        C, T = arm_at(1.0)
        B.obj('arm%d_nozzle' % i, bm_closed_lathe([(0, -0.06), (0.075, -0.06), (0.08, 0.04), (0.12, 0.12), (0.095, 0.12), (0.0, 0.08)] if not lo else [(0, -0.06), (0.08, -0.06), (0.12, 0.12), (0.0, 0.1)], B.pick(12, 6), aim(tuple(T)), tuple(C)), M_br, parent=A)
        # the burner (rigV 3): the nozzle's bore holds a white-hot ember core and a glowing heat ring at its lip; the fire
        # itself is drawn live by the game (cartOctoFlames in src/43_cart_bb_glb.js: licking additive tongues, a hot core,
        # rising embers and a flickering light, anchored here at FLAME_AT and leaning up along the nozzle)
        B.obj('arm%d_core' % i, bm_ellipsoid(0.07, 0.07, 0.07, B.pick(10, 6), B.pick(5, 3), tuple(C + T * 0.1)), M_core, parent=A)
        if not lo: B.obj('arm%d_heat' % i, bm_torus(0.1, 0.022, 12, 3, aim(tuple(T)), tuple(C + T * 0.115)), M_heat, parent=A)

    # ---- wheels, seat, size info ----
    B.wheels_pro(1.1, 1.7, -1.7, r=0.5, w=0.42, rim=COL2, tyre='#1a1410', cap=LIGHT, stripe=LIGHT)
    B.seat_round(0, 1.6, -1.75, col='#5a2a14', accent=LIGHT)
    top = HEAD[1] + hc[1] + hr[1]
    B.info(5.4, 3.6, round(top, 2), muzzle=(0, 1.6, 1.3), wheelR=0.5,
           extra={'arms': 8, 'armZ': 0.55, 'flames': [round(v, 3) for v in (*FLAME_AT, *FLAME_DIR)], 'chimney': [0, round(HEAD[1] + c1[1] + 0.1, 2), round(HEAD[2] + c1[2], 2)], 'sight': [round(top - 0.3, 2), round(HEAD[2] + hc[2], 2)]})
    B.body['rigV'] = 3

LEVEL_OV = {'hi': {'cyl': 24, 'bevel': 3, 'ico': 1}, 'lo': {'ico': 1}}
if __name__ == '__main__':
    run('calamari_inferno', build, report=True, views=['side', 'high'], level_overrides=LEVEL_OV)
