# Dusty Doubloon (Art Cart car #8): a pirate galleon that ran aground on dry land. On purpose.
# A lapstrake oak hull on an iron trailer frame, gold-leaf trim, amber portholes and lanterns, two billowing sails,
# a grinning-sun figurehead and a chrome anchor. The captain steers a ship's wheel from the stern castle.
# Headless:  /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/dusty_doubloon.py
# Writes assets/models/art-cart/dusty_doubloon.glb (showroom, 20–30k tris) and dusty_doubloon_lo.glb (race, 5–8k).
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cartkit import *

COL, COL2, LIGHT = '#8a5a32', '#ffd06a', '#ffb84a'   # CART_CARS.galleon palette: wood, gold, amber
PINK = '#ff4fd8'
HULL_Y, SZ = 0.55, 2.35                                 # the procedural hull lathe: centre height and z stretch
PROF = [(0.55, 0), (1.0, 0.25), (1.25, 0.7), (1.3, 1.2), (1.28, 1.3)]
BANDS = [0.0, 0.3, 0.55, 0.8, 1.05, 1.3]                # strake edges (profile heights); the top one is the wale
LIP = 0.035
GUNWALE = HULL_Y + 1.3                                  # 1.85
DECK = HULL_Y + 1.27                                    # 1.82 (deck top)

# ---- local helpers ----
def hull_r(h):
    """Profile radius at height h above the hull centre (piecewise linear through the procedural profile)."""
    for (r0, h0), (r1, h1) in zip(PROF, PROF[1:]):
        if h <= h1: return r0 + (r1 - r0) * (h - h0) / (h1 - h0)
    return PROF[-1][0]
def hull_x(y, z, extra=0.0):
    """The hull's half-width at engine height y and station z (plus a radial offset)."""
    a = hull_r(y - HULL_Y) + extra; b = a * SZ; k = 1 - (z / b) ** 2
    return a * math.sqrt(k) if k > 0 else 0.0
def hull_n(x, y, z):
    """Outward normal of the hull oval at (x, y, z), ignoring the profile slope (engine vector)."""
    a = hull_r(y - HULL_Y); b = a * SZ
    n = Vector((x / a ** 2, 0.0, z / b ** 2)); n.normalize(); return n
def aim(d):
    """A matrix pointing a primitive's axis (Blender Z) along the engine direction d; use as `axis`/`M`."""
    v = E(*d); v.normalize()
    return v.to_track_quat('Z', 'Y').to_matrix().to_4x4()
def frame(ax, ay, az):
    """Rotation matrix (for bm_box/bm_profile M) that maps a piece's local engine x/y/z axes onto ax/ay/az."""
    c0 = E(*ax); c1 = -E(*az); c2 = E(*ay)
    return Matrix(((c0.x, c1.x, c2.x, 0), (c0.y, c1.y, c2.y, 0), (c0.z, c1.z, c2.z, 0), (0, 0, 0, 1)))
def heart(k, n=24): return heart_pts(n, k, 6 * k)
def oval_walk(R, step, a0=0.0, a1=TAU):
    """Points (cos a * R, sin a * R * SZ) along the hull oval between the torus angles a0..a1, spaced ~step apart
    by arc length. Returns (a, x, z) in engine coords (torus angle a: 0 = the car's left, pi/2 = the stern)."""
    out = []; acc = step; a = a0; da = 0.004
    while a < a1:
        x, z = math.cos(a) * R, -math.sin(a) * R * SZ
        if acc >= step: out.append((a, x, z)); acc = 0.0
        acc += math.hypot(R * math.sin(a), R * SZ * math.cos(a)) * da; a += da
    return out
def ring_disc(r, y0, y1, seg, at=(0, 0, 0)):
    """A thin oval slab (deck, platforms) between heights y0 and y1 (engine), stretched like the hull."""
    return bm_lathe([(r, y0 - at[1]), (r, y1 - at[1])], seg, at=at, sz=SZ)

def build(B):
    L = B.L; lo = B.lo; body = B.body
    # ---- materials ----
    M_oak = paint('oak', COL, coat=0.6, rough=0.32, metal=0.0)
    M_oak2 = paint('oak_dark', '#6a4426', coat=0.6, rough=0.34, metal=0.0)
    M_oak3 = paint('oak_deep', '#4e3018', coat=0.5, rough=0.36, metal=0.0)
    M_plank = matte('plank_seam', '#2a1a0e')
    M_gold = metal('gold', COL2, 0.14); M_gold2 = metal('gold_dark', '#c89a3a', 0.24)
    M_iron = metal('iron', '#2a2422', 0.5); M_iron2 = metal('iron_dark', '#1a1614', 0.6)
    M_canvas = satin('canvas', '#f4ead2', 0.62); M_red = satin('band_red', '#c8302a', 0.5)
    M_rope = matte('rope', '#b89a5a', 0.9)
    M_amber = glow('amber_glass', LIGHT, strength=2.6, rough=0.2)
    M_lantern = led(LIGHT, 4.0); M_sun = glow('sun_gold', COL2, strength=0.9, rough=0.2)
    M_pink = led(PINK, 3.0); M_coins = glow('coins', '#ffe08a', strength=1.6, rough=0.25)
    M_flag = satin('flag_dark', '#1a1a1e', 0.6)
    M_ledA, M_ledG = led(LIGHT, 4.0), led(COL2, 4.0)
    def rivet(name, p, r=0.024, parent=None, m=M_gold):
        if lo: return
        B.obj(name, bm_ico(r, 0, p), m, parent=parent)
    def box_between(name, p0, p1, w, d, n, m, parent=None, bevel=None):
        """A box of width w and thickness d spanning the points p0 -> p1, its face along the normal n."""
        p0 = Vector(p0); p1 = Vector(p1); ay = p1 - p0; Ln = ay.length; ay.normalize(); az = Vector(n).normalized()
        ax = ay.cross(az); ax.normalize(); az = ax.cross(ay)
        c = (p0 + p1) / 2
        return B.obj(name, bm_box(w, Ln, d, tuple(c), M=frame(tuple(ax), tuple(ay), tuple(az))), m, parent=parent, bevel=bevel, bevel_angle=False)

    # ---- hull: lapstrake oak strakes (hi) or one smooth lathe (lo), a dark keel and bottom ----
    seg = B.pick(40, 16)
    hull = []
    if lo:
        hull.append(B.obj('hull', bm_lathe(PROF, seg, at=(0, HULL_Y, 0), sz=SZ), M_oak))
    else:
        for i, (h0, h1) in enumerate(zip(BANDS, BANDS[1:])):
            wale = i == len(BANDS) - 2; lip = 0.05 if wale else LIP
            prof = [(hull_r(h0) + lip, h0 - 0.02), (hull_r(h0) + lip, h0 + 0.035)]
            rows = 3
            for k in range(1, rows + 1):
                h = h0 + 0.035 + (h1 - h0 - 0.035) * k / rows
                prof.append((hull_r(h) + lip * (1 - k / rows) * 0.25, h))
            hull.append(B.obj('strake_%d' % i, bm_lathe(prof, seg, at=(0, HULL_Y, 0), sz=SZ), M_oak3 if wale else (M_oak if i % 2 else M_oak2)))
    B.obj('keel_plate', bm_lathe([(0, -0.05), (0.5, -0.04), (0.6, 0.0)], B.pick(24, 12), at=(0, HULL_Y, 0), sz=SZ), M_iron2)
    B.obj('keel', bm_box(0.16, 0.2, 3.4, (0, 0.56, 0)), M_iron2, bevel=0.03, bevel_angle=False)
    # wheel wells cut into the lower strakes, with an iron arch ring
    for i, (x, z) in enumerate([(1.1, 1.9), (-1.1, 1.9), (1.1, -1.9), (-1.1, -1.9)]):
        targets = hull if lo else hull[:3]
        B.cut(targets, bm_cyl(0.58, 0.58, 0.9, L['arch'], AX, (x, 0.48, z)), 'arch_%d' % i)
        if not lo: B.obj('arch_ring_%d' % i, bm_torus(0.6, 0.035, 12, 5, AX, (x * 0.95, 0.48, z), sweep=(math.pi / 2, 3 * math.pi / 2)), M_iron)
    # ---- the trailer frame it ran aground on: iron rails, axles, chocks, a chrome bumper ----
    for s in (1, -1):
        B.obj('rail_%d' % (s > 0), bm_box(0.12, 0.16, 4.9, (s * 0.7, 0.5, -0.1)), M_iron, bevel=0.02, bevel_angle=False)
        for z in (1.0, -1.0): B.obj('chock_%d_%d' % (s > 0, z > 0), bm_box(0.14, 0.14, 0.32, (s * 0.7, 0.64, z)), M_iron2)
    for z in (1.9, -1.9):
        B.obj('axle_%d' % (z > 0), bm_rod((-1.05, 0.48, z), (1.05, 0.48, z), 0.045, L['rod']), dark_chrome())
        B.obj('axle_hs_%d' % (z > 0), bm_rod((-0.78, 0.48, z), (0.78, 0.48, z), 0.075, L['rod']), M_iron)
    B.obj('bar_front', bm_box(2.1, 0.2, 0.14, (0, 0.66, 2.3)), M_iron, bevel=0.03, bevel_angle=False)
    B.obj('bar_rear', bm_box(2.1, 0.2, 0.14, (0, 0.66, -2.5)), M_iron, bevel=0.03, bevel_angle=False)
    B.obj('bumper', bm_rod((-1.0, 0.62, 2.42), (1.0, 0.62, 2.42), 0.05, L['rod']), chrome())
    B.lamps(0.85, 0.8, 2.3, -2.5)
    # ---- gunwale: gold rail ring, gold trim at the wale, deck, plank seams, a baluster railing ----
    B.obj('gunwale', bm_torus(1.3, 0.05, B.pick(40, 16), B.pick(6, 5), AY, (0, GUNWALE, 0), sy=SZ), M_gold)
    B.obj('wale_trim', bm_torus(hull_r(1.05) + 0.06, 0.025, B.pick(40, 16), B.pick(5, 3), AY, (0, HULL_Y + 1.03, 0), sy=SZ), M_gold2)
    B.obj('deck', ring_disc(1.265, DECK - 0.04, DECK, seg, at=(0, HULL_Y, 0)), M_oak2)
    if not lo:
        for k in range(6):
            for s in (1, -1):
                x = s * (0.11 + 0.22 * k); zl = 2 * SZ * 1.265 * math.sqrt(max(0.0, 1 - (x / 1.265) ** 2)) - 0.12
                B.obj('deck_seam_%d_%d' % (s > 0, k), bm_box(0.016, 0.012, zl, (x, DECK, 0)), M_plank, smooth=False)
        # baluster railing on the main deck (not around the stern castle)
        for a, x, z in oval_walk(1.3, 0.5, math.radians(155), math.radians(385)):
            B.obj('baluster_%d' % int(math.degrees(a)), bm_rod((x, GUNWALE + 0.03, z), (x, GUNWALE + 0.36, z), 0.02, 6), M_oak3)
            B.obj('baluster_cap_%d' % int(math.degrees(a)), bm_ico(0.03, 0, (x, GUNWALE + 0.37, z)), M_gold)
        B.obj('toprail', bm_torus(1.3, 0.025, 40, 5, AY, (0, GUNWALE + 0.38, 0), sweep=(math.radians(155), math.radians(385)), sy=SZ), M_oak)
    # LED rope-light along the gunwale: amber and gold bulbs riding on the rail
    bulbs = [(a, x, z) for a, x, z in oval_walk(1.33, B.pick(0.5, 1.1)) if z > -1.7 or abs(x) > 1.05]
    for i, (a, x, z) in enumerate(bulbs):
        c = LIGHT if i % 2 else COL2
        B.obj('rope_led_%d' % i, bm_ico(0.05, L['ico'], (x, GUNWALE + 0.07, z)), M_ledA if i % 2 else M_ledG)
        if i % B.pick(7, 4) == 0: B.light(x, GUNWALE + 0.1, z, 0.5, c, led=1)
    # ---- iron strapping down the strakes with gold rivets (hi) ----
    if not lo:
        for s in (1, -1):
            for zi, z in enumerate((-1.0, 0.0, 1.0)):
                for i, (h0, h1) in enumerate(zip(BANDS[1:], BANDS[2:])):
                    y0, y1 = HULL_Y + h0 + 0.04, HULL_Y + h1 - 0.01
                    p0 = (s * hull_x(y0, z, LIP), y0, z); p1 = (s * hull_x(y1, z, 0.01), y1, z)
                    n = hull_n(p0[0], (y0 + y1) / 2, z)
                    box_between('strap_%d_%d_%d' % (s > 0, zi, i), p0, p1, 0.09, 0.05, n, M_iron)
                    mid = ((Vector(p0) + Vector(p1)) / 2) + n * 0.035
                    rivet('strap_rv_%d_%d_%d' % (s > 0, zi, i), tuple(mid))
    # ---- portholes: gold ring, amber glass, aimed along the hull normal ----
    def window(name, p, n, R):
        """A round glowing window: gold ring + amber glass facing n (a flat gold disc + glass at lo)."""
        p = Vector(p); n = Vector(n).normalized(); A = aim(tuple(n))
        if lo:
            B.obj(name + '_ring', bm_cyl(R + 0.03, R + 0.03, 0.025, 10, A, tuple(p + n * 0.01)), M_gold)
            B.obj(name + '_glass', bm_cyl(R, R, 0.03, 10, A, tuple(p + n * 0.02)), M_amber)
        else:
            B.obj(name + '_ring', bm_torus(R + 0.015, 0.027, 14, 5, A, tuple(p + n * 0.02)), M_gold)
            B.obj(name + '_glass', bm_cyl(R, R, 0.03, 14, A, tuple(p + n * 0.015)), M_amber)
    for s in (1, -1):
        for i, z in enumerate((-1.5, -0.5, 0.5, 1.5)):
            x = s * hull_x(1.25, z, 0.03); n = hull_n(x, 1.25, z); p = Vector((x, 1.25, z))
            window('port_%d_%d' % (s > 0, i), p, n, 0.115)
            if not lo:
                for k in range(4):
                    a = k / 4 * TAU + math.pi / 4
                    t = Vector((0, 1, 0)).cross(n); q = p + n * 0.03 + t * math.cos(a) * 0.17 + Vector((0, math.sin(a) * 0.17, 0))
                    rivet('port_rv_%d_%d_%d' % (s > 0, i, k), tuple(q), 0.02)
    # ---- cannons: dark iron barrels with chrome rings through gold-framed gun ports, lids propped open ----
    for s in (1, -1):
        for i, z in enumerate((-0.7, 0.6)):
            x0 = hull_x(1.55, z, LIP + 0.01)
            B.obj('port_recess_%d_%d' % (s > 0, i), bm_box(0.1, 0.36, 0.36, (s * (x0 - 0.04), 1.55, z)), M_iron2, smooth=False)
            B.obj('cannon_%d_%d' % (s > 0, i), bm_rod((s * (x0 - 0.3), 1.55, z), (s * 1.62, 1.55, z), 0.13, B.pick(18, 10), r1=0.1), M_iron)
            B.obj('cannon_muzzle_%d_%d' % (s > 0, i), bm_torus(0.1, 0.03, B.pick(12, 8), B.pick(5, 4), AX, (s * 1.6, 1.55, z)), chrome())
            B.obj('cannon_bore_%d_%d' % (s > 0, i), bm_cyl(0.075, 0.075, 0.02, B.pick(12, 8), AX, (s * 1.635, 1.55, z)), M_iron2)
            if not lo:
                B.obj('cannon_ring_%d_%d' % (s > 0, i), bm_torus(0.125, 0.025, 12, 5, AX, (s * (x0 + 0.1), 1.55, z)), chrome())
                B.obj('cannon_ring2_%d_%d' % (s > 0, i), bm_torus(0.115, 0.022, 12, 5, AX, (s * (x0 + 0.3), 1.55, z)), chrome())
                for k, (dy, dz) in enumerate(((0.21, 0), (-0.21, 0), (0, 0.21), (0, -0.21))):
                    B.obj('port_frame_%d_%d_%d' % (s > 0, i, k), bm_box(0.03, 0.04 if dy else 0.46, 0.46 if dy else 0.04, (s * (x0 + 0.005), 1.55 + dy, z + dz)), M_gold2, smooth=False)
                # the lid, hinged above the port and propped open
                th = math.radians(100); u = (s * math.sin(th), math.cos(th), 0)
                hinge = Vector((s * (x0 + 0.02), 1.78, z)); c = hinge + Vector(u) * 0.19
                n = Vector((0, 0, 1)).cross(Vector(u)); n.normalize()
                B.obj('port_lid_%d_%d' % (s > 0, i), bm_box(0.4, 0.38, 0.035, tuple(c), M=frame((0, 0, 1), u, tuple(n))), M_oak2, bevel=0.012, bevel_angle=False, segments=1)
                for k in (-1, 1): rivet('lid_rv_%d_%d_%d' % (s > 0, i, k > 0), tuple(c + Vector((0, 0, k * 0.15)) + n * 0.02 * (-s)), 0.02)
    # ---- stern castle: bevelled oak box, gold trim, plank seams, iron corner straps, round windows, a door ----
    castle = B.obj('castle', bm_box(2.0, 0.9, 1.2, (0, 2.1, -1.9)), M_oak2, bevel=0.06, bevel_angle=False)
    B.obj('castle_trim', bm_box(2.1, 0.08, 1.3, (0, 2.58, -1.9)), M_gold, bevel=0.025, bevel_angle=False)
    B.obj('castle_trim_lo', bm_box(2.06, 0.06, 1.26, (0, 1.68, -1.9)), M_gold2, bevel=0.02, bevel_angle=False)
    B.obj('castle_deck', bm_box(1.9, 0.03, 1.2, (0, 2.63, -1.9)), M_oak, smooth=False)
    for s in (1, -1):
        for zi, z in enumerate((-1.3, -2.5)):
            B.obj('castle_strap_%d_%d' % (s > 0, zi), bm_box(0.07, 0.82, 0.07, (s * 1.0, 2.1, z)), M_iron, smooth=False)
            for k, y in enumerate((1.85, 2.1, 2.35)):
                rivet('castle_rv_%d_%d_%d' % (s > 0, zi, k), (s * 1.04, y, z)); rivet('castle_rv2_%d_%d_%d' % (s > 0, zi, k), (s * 1.0, y, z - 0.04 if z < -2 else z + 0.04))
        # side windows and a stern corbel under the overhang
        for zi, z in enumerate((-1.7, -2.2)): window('swin_%d_%d' % (s > 0, zi), (s * 1.0, 2.15, z), (s, 0, 0), 0.12)
        B.obj('corbel_%d' % (s > 0), bm_rod((s * (hull_x(1.4, -2.25) - 0.05), 1.3, -2.25), (s * 0.95, 1.68, -2.35), 0.05, L['rod']), M_oak3)
    for xi, x in enumerate((-0.55, 0.0, 0.55)): window('win_%d' % xi, (x, 2.15, -2.5), (0, 0, -1), 0.13)
    if not lo:
        for y in (1.9, 2.4):
            B.obj('castle_seam_b_%d' % int(y * 10), bm_box(2.0, 0.014, 0.012, (0, y, -2.51)), M_plank, smooth=False)
            for s in (1, -1): B.obj('castle_seam_s_%d_%d' % (s > 0, int(y * 10)), bm_box(0.012, 0.014, 1.2, (s * 1.01, y, -1.9)), M_plank, smooth=False)
        B.obj('door', bm_box(0.36, 0.56, 0.03, (0.5, 1.96, -1.29)), M_oak3, bevel=0.02, bevel_angle=False)
        B.obj('door_knob', bm_ico(0.025, 1, (0.62, 1.96, -1.27)), M_gold)
    # stern-deck railing: gold rail on oak posts around the back and sides
    for s in (1, -1):
        for z in (-1.4, -1.95):
            B.obj('srail_post_%d_%d' % (s > 0, int(-z * 10)), bm_rod((s * 0.95, 2.63, z), (s * 0.95, 2.95, z), 0.022, 6), M_oak3)
        B.obj('srail_side_%d' % (s > 0), bm_rod((s * 0.95, 2.95, -1.38), (s * 0.95, 2.95, -2.45), 0.022, 6), M_gold)
    for x in (-0.5, 0.5): B.obj('srail_post_b_%d' % (x > 0), bm_rod((x, 2.63, -2.45), (x, 2.95, -2.45), 0.022, 6), M_oak3)
    B.obj('srail_back', bm_rod((-0.95, 2.95, -2.45), (0.95, 2.95, -2.45), 0.022, 6), M_gold)
    # lantern cages on the stern corners (the game lights)
    for s in (1, -1):
        p = (s * 0.95, 2.95, -2.45)
        B.obj('lantern_post_%d' % (s > 0), bm_rod((p[0], 2.62, p[2]), (p[0], 2.78, p[2]), 0.03, L['rod']), M_iron)
        B.obj('lantern_base_%d' % (s > 0), bm_cyl(0.12, 0.1, 0.04, B.pick(12, 8), AY, (p[0], 2.8, p[2])), M_iron)
        B.obj('lantern_cap_%d' % (s > 0), bm_cyl(0.13, 0.04, 0.09, B.pick(12, 8), AY, (p[0], 3.145, p[2])), M_iron)
        if not lo: B.obj('lantern_knob_%d' % (s > 0), bm_torus(0.035, 0.012, 8, 4, AZ, (p[0], 3.22, p[2])), M_gold)
        B.obj('lantern_bulb_%d' % (s > 0), bm_ellipsoid(0.1, 0.15, 0.1, B.pick(12, 8), B.pick(6, 5), p), M_lantern)
        if not lo:
            for k in range(4):
                a = k / 4 * TAU + math.pi / 4
                B.obj('lantern_bar_%d_%d' % (s > 0, k), bm_rod((p[0] + math.cos(a) * 0.11, 2.81, p[2] + math.sin(a) * 0.11), (p[0] + math.cos(a) * 0.11, 3.1, p[2] + math.sin(a) * 0.11), 0.012, 5), M_iron)
        B.light(p[0], p[1], p[2], 1.4, LIGHT)
    # ---- helm: an oak post up from the main deck, the ship's wheel on the steer bone ----
    B.obj('helm_post', bm_box(0.2, 1.06, 0.2, (0, 2.33, -1.15)), M_oak3, bevel=0.03, bevel_angle=False)
    B.obj('helm_cap', bm_box(0.26, 0.05, 0.26, (0, 2.87, -1.15)), M_gold2, bevel=0.015, bevel_angle=False)
    for s in (1, -1): B.obj('helm_fork_%d' % (s > 0), bm_rod((s * 0.08, 2.88, -1.3), (s * 0.08, 3.2, -1.3), 0.025, 6), M_iron)
    B.obj('helm_axle', bm_rod((0, 3.2, -1.34), (0, 3.2, -1.1), 0.035, L['rod']), dark_chrome())
    st = B.seat(0, 3.02, -1.85, col='#3a2414', accent=COL2, wheelY=3.2, wheelZ=-1.2, tilt=0.15, column=False)
    B.obj('wheel_rim', bm_torus(0.34, 0.035, B.pick(24, 12), B.pick(6, 4), AZ, (0, 0, 0)), M_oak2, parent=st)
    if not lo: B.obj('wheel_rim_gold', bm_torus(0.34, 0.012, 24, 4, AZ, (0, 0, 0.038)), M_gold, parent=st)
    for k in range(8):
        a = k / 8 * TAU; c, s_ = math.cos(a), math.sin(a)
        B.obj('wheel_spoke_%d' % k, bm_rod((c * 0.06, s_ * 0.06, 0), (c * 0.47, s_ * 0.47, 0), 0.022, B.pick(7, 5)), M_oak, parent=st)
        if not lo: B.obj('wheel_handle_%d' % k, bm_ico(0.032, 1, (c * 0.47, s_ * 0.47, 0)), M_gold, parent=st)
    # ---- bowsprit and the grinning-sun figurehead on the bow ----
    B.obj('bowsprit', bm_rod((0, 1.9, 2.6), (0, 2.35, 3.6), 0.09, L['rod'], r1=0.05), M_oak2)
    if not lo: B.obj('bowsprit_band', bm_torus(0.085, 0.018, 10, 5, aim((0, 0.45, 1.0)), (0, 2.08, 3.0)), M_gold)
    B.obj('bowsprit_tip', bm_ico(0.07, 1, (0, 2.36, 3.62)), M_gold)
    sunp = (0, 1.85, 3.1)
    B.obj('sun_plinth', bm_cyl(0.27, 0.3, 0.3, B.pick(20, 10), AZ, (0, 1.85, 2.88)), M_oak3)
    sun = B.obj('sun_disc', bm_cyl(0.32, 0.32, 0.2, B.pick(32, 14), AZ, sunp), M_sun, bevel=0.05, segments=B.pick(4, 1))
    nray = B.pick(12, 8)
    for k in range(nray):
        a = k / nray * TAU + math.pi / nray; c, s_ = math.cos(a), math.sin(a)
        pts = [(c * 0.28 - s_ * 0.07, s_ * 0.28 + c * 0.07), (c * 0.52, s_ * 0.52), (c * 0.28 + s_ * 0.07, s_ * 0.28 - c * 0.07)]
        B.obj('sun_ray_%d' % k, bm_profile(pts, 0.1, (0, 1.85, 3.08)), M_gold, smooth=False)
    for s in (1, -1): B.obj('sun_eye_%d' % (s > 0), bm_ico(0.045, 1, (s * 0.12, 1.93, 3.2)), M_iron2)
    B.obj('sun_grin', bm_torus(0.17, 0.028, B.pick(16, 10), B.pick(6, 4), AZ, (0, 1.82, 3.2), sweep=(math.pi * 1.1, math.pi * 1.9)), M_iron2)
    B.obj('sun_nose', bm_ico(0.04, 1, (0, 1.84, 3.21)), M_gold2)
    # ---- the chrome anchor hanging off the port bow on a chain ----
    AY_, AZ_ = 1.5, 2.6
    ap = Vector((hull_x(AY_, AZ_, 0.06), AY_, AZ_)); n = hull_n(ap.x, AY_, AZ_); ap = ap + n * 0.07
    ax = Vector((0, 1, 0)).cross(n); ax.normalize()   # across the anchor (tangent to the hull)
    FA = frame(tuple(ax), (0, 1, 0), tuple(n))
    def apt(lx, ly, lz=0.0): return tuple(ap + ax * lx + Vector((0, ly, 0)) + n * lz)
    B.obj('anchor_shank', bm_rod(apt(0, 0.1), apt(0, -0.6), 0.028, L['rod']), chrome())
    B.obj('anchor_stock', bm_rod(apt(-0.24, -0.02), apt(0.24, -0.02), 0.028, L['rod'], r1=0.028), chrome())
    B.obj('anchor_ring', bm_torus(0.065, 0.015, B.pick(12, 8), B.pick(5, 4), FA, apt(0, 0.16)), chrome())
    B.obj('anchor_arms', bm_torus(0.22, 0.028, B.pick(16, 10), B.pick(6, 4), FA, apt(0, -0.38), sweep=(math.pi * 1.15, math.pi * 1.85)), chrome())
    for sgn in (-1, 1):
        fl = [(sgn * 0.18, -0.53), (sgn * 0.31, -0.44), (sgn * 0.2, -0.68)] if sgn > 0 else [(sgn * 0.18, -0.53), (sgn * 0.2, -0.68), (sgn * 0.31, -0.44)]
        B.obj('anchor_fluke_%d' % (sgn > 0), bm_profile(fl, 0.05, tuple(ap), M=FA), chrome(), smooth=False)
    if not lo:
        top = Vector((hull_x(GUNWALE, AZ_, 0.1), GUNWALE + 0.1, AZ_)); bot = Vector(apt(0, 0.22))
        for k in range(4):
            t = k / 4; c = bot + (top - bot) * t
            B.obj('chain_%d' % k, bm_torus(0.035, 0.01, 6, 3, aim(tuple(ax if k % 2 else n)), tuple(c)), chrome())
    # ---- masts, yards, crow's nest, rigging ----
    def mast(name, z, h, yard_y):
        top = 1.6 + h
        B.obj(name, bm_rod((0, 1.6, z), (0, top, z), 0.1, B.pick(12, 7), r1=0.065), M_oak)
        B.obj(name + '_collar', bm_torus(0.13, 0.03, B.pick(14, 8), B.pick(6, 4), AY, (0, DECK + 0.02, z)), M_gold)
        B.obj(name + '_finial', bm_ico(0.09, B.pick(2, 1), (0, top + 0.05, z)), M_gold)
        B.obj(name + '_yard', bm_rod((-1.25, yard_y, z - 0.08), (1.25, yard_y, z - 0.08), 0.045, B.pick(8, 5), r1=0.045), M_oak2)
        if not lo:
            for yb in (2.7, 3.5): B.obj(name + '_band_%d' % int(yb * 10), bm_torus(0.1 - 0.035 * (yb - 1.6) / h, 0.018, 12, 5, AY, (0, yb, z)), M_iron)
            for s in (1, -1): B.obj(name + '_yard_cap_%d' % (s > 0), bm_ico(0.05, 1, (s * 1.26, yard_y, z - 0.08)), M_gold2)
        return top
    ft = mast('mast_fore', 0.9, 3.2, 4.4); mt = mast('mast_main', -0.6, 3.6, 4.74)
    # crow's nest near the main mast top: oak bucket, gold hoop
    cn = (0, 4.95, -0.6)
    B.obj('nest_out', bm_lathe([(0.3, -0.15), (0.34, -0.08), (0.37, 0.15)], B.pick(18, 10), at=cn, caps=False), M_oak2)
    B.obj('nest_in', bm_lathe([(0.27, -0.12), (0.32, -0.06), (0.35, 0.15)], B.pick(18, 10), at=cn, caps=False, flip=True), M_oak3)
    B.obj('nest_floor', bm_cyl(0.3, 0.3, 0.03, B.pick(18, 10), AY, (0, 4.8, -0.6)), M_oak3)
    B.obj('nest_hoop', bm_torus(0.36, 0.022, B.pick(18, 10), B.pick(6, 4), AY, (0, 5.1, -0.6)), M_gold)
    if not lo: B.obj('nest_hoop2', bm_torus(0.33, 0.016, 18, 5, AY, (0, 4.86, -0.6)), M_iron)
    B.obj('flagpole', bm_rod((0, mt, -0.6), (0, 5.58, -0.6), 0.03, 6, r1=0.02), M_oak3)
    # rigging: shrouds from each mast to the gunwale, a forestay to the bowsprit, a stay between the masts
    rig = [((0, 4.35, 0.9), (s * (hull_x(GUNWALE, z) + 0.03), GUNWALE + 0.02, z)) for s in (1, -1) for z in (1.5, 0.45)]
    rig += [((0, 4.7, -0.6), (s * (hull_x(GUNWALE, z) + 0.03), GUNWALE + 0.02, z)) for s in (1, -1) for z in (-0.95, -1.3)]
    rig += [((0, ft, 0.9), (0, 2.3, 3.5)), ((0, mt, -0.6), (0, ft, 0.9))]
    for i, (a, b) in enumerate(rig): B.obj('rig_%d' % i, bm_rod(a, b, 0.012, 4), M_rope)
    # ---- deck furniture: hatch grating, barrel, treasure chest, rope coils ----
    B.obj('hatch', bm_box(0.7, 0.1, 0.6, (0, DECK + 0.04, 0.15)), M_oak3, bevel=0.02, bevel_angle=False)
    B.obj('hatch_trim', bm_box(0.76, 0.03, 0.66, (0, DECK + 0.1, 0.15)), M_gold2, smooth=False)
    if not lo:
        for k in range(5): B.obj('hatch_slat_%d' % k, bm_box(0.6, 0.02, 0.05, (0, DECK + 0.115, 0.15 - 0.22 + k * 0.11)), M_plank, smooth=False)
    bp = (0.85, DECK, 0.3)
    B.obj('barrel', bm_lathe([(0.15, 0), (0.18, 0.12), (0.19, 0.22), (0.18, 0.32), (0.15, 0.44)], B.pick(14, 8), at=bp), M_oak2)
    if not lo:
        for hy in (0.09, 0.35): B.obj('barrel_hoop_%d' % int(hy * 100), bm_torus(0.185, 0.014, 14, 4, AY, (bp[0], bp[1] + hy, bp[2])), M_iron)
    cp = (-0.8, DECK, 0.3)
    B.obj('chest', bm_box(0.55, 0.3, 0.4, (cp[0], cp[1] + 0.15, cp[2])), M_oak2, bevel=0.025, bevel_angle=False)
    B.obj('chest_lid', bm_box(0.57, 0.1, 0.42, (cp[0], cp[1] + 0.5, cp[2] - 0.32), M=frame((1, 0, 0), (0, 0.42, 0.91), (0, -0.91, 0.42))), M_oak2, bevel=0.02, bevel_angle=False)
    B.obj('chest_coins', bm_ellipsoid(0.25, 0.1, 0.17, B.pick(14, 8), B.pick(6, 4), (cp[0], cp[1] + 0.3, cp[2]), phi1=math.pi / 2), M_coins)
    for zz in (-0.12, 0.12): B.obj('chest_strap_%d' % (zz > 0), bm_box(0.57, 0.32, 0.03, (cp[0], cp[1] + 0.15, cp[2] + zz)), M_iron, smooth=False)
    B.obj('chest_lock', bm_box(0.08, 0.1, 0.03, (cp[0], cp[1] + 0.2, cp[2] + 0.21)), M_gold)
    if not lo:
        for rp in ((0.75, DECK, 1.5), (-0.7, DECK, -0.95)):
            for k, R in enumerate((0.09, 0.15, 0.21)):
                B.obj('coil_%d_%d' % (rp[0] > 0, k), bm_torus(R, 0.03, 12, 4, AY, (rp[0], rp[1] + 0.03, rp[2])), M_rope)
    # ---- the sails: two-sided cream canvas billowing forward, a red band, yards and a glowing heart ----
    def sail(name, pivot, w, h):
        P = B.part(name, pivot); nu, nv = B.pick(14, 7), B.pick(12, 6)
        def sheet(u, v, off=0.0, v0=0.0, v1=1.0):
            v = v0 + (v1 - v0) * v
            x = (u - 0.5) * w * (1 - (1 - v) * 0.12); y = (v - 0.5) * h
            z = 0.42 * math.sin(u * math.pi) * (0.55 + 0.45 * math.sin(v * math.pi)) + 0.025 * math.sin(u * 4 * math.pi) * math.sin(v * math.pi) + off
            return (x, y, z)
        B.obj(name + '_front', bm_surf(nu, nv, sheet), M_canvas, parent=P)
        B.obj(name + '_back', bm_surf(nu, nv, lambda u, v: sheet(u, v, -0.025), flip=True), M_canvas, parent=P)
        B.obj(name + '_band_f', bm_surf(nu, 2, lambda u, v: sheet(u, v, 0.012, 0.43, 0.57)), M_red, parent=P)
        B.obj(name + '_band_b', bm_surf(nu, 2, lambda u, v: sheet(u, v, -0.037, 0.43, 0.57), flip=True), M_red, parent=P)
        for k, yy in enumerate((h / 2, -h / 2)):
            B.obj(name + '_yard_%d' % k, bm_rod((-w / 2 - 0.1, yy, 0), (w / 2 + 0.1, yy, 0), 0.04 if k == 0 else 0.035, B.pick(8, 5)), M_oak2, parent=P)
            if not lo:
                for s in (1, -1): B.obj(name + '_yard_cap_%d_%d' % (k, s > 0), bm_ico(0.045, 1, (s * (w / 2 + 0.11), yy, 0)), M_gold2, parent=P)
        hz = sheet(0.5, 0.5 + 0.12 / h)[2]
        B.obj(name + '_heart', bm_profile(heart(0.0875 * w * 0.3 / 2.8, B.pick(28, 14)), 0.04, (0, 0.12, hz + 0.01)), M_pink, parent=P)
        return P
    sail('sailFore', (0, 3.2, 0.95), 2.2, 1.8)
    sail('sailMain', (0, 3.6, -0.55), 2.4, 2.0)
    # ---- the pennant: a dark swallow-tailed flag streaming from the main mast top (the pose fn yaws it back) ----
    F = B.part('flag', (0, 5.3, -0.6))
    def pennant(u, v, off=0.0):
        return (0.03 * math.sin(u * TAU * 1.5) * u + off, (v - 0.5) * 0.42 * (1 - u * 0.55), u * 0.9)
    B.obj('flag_a', bm_surf(B.pick(12, 6), B.pick(4, 2), pennant), M_flag, parent=F)
    B.obj('flag_b', bm_surf(B.pick(12, 6), B.pick(4, 2), lambda u, v: pennant(u, v, -0.012), flip=True), M_flag, parent=F)
    B.obj('flag_edge', bm_rod((0, -0.21, 0.0), (0, 0.21, 0.0), 0.02, 5), M_gold2, parent=F)
    B.obj('flag_heart', bm_profile(heart(0.0875 * 0.28 / 2.8, B.pick(24, 12)), 0.07, (0, 0.0, 0.38), M=frame((0, 0, 1), (0, 1, 0), (-1, 0, 0))), M_pink, parent=F)
    # ---- wheels and the car's size info ----
    B.wheels(1.05, 1.9, -1.9, r=0.48, w=0.4, rim=COL2, tyre='#1a1410', cap=LIGHT)
    B.info(6.4, 3.0, 5.6, muzzle=(0, 1.55, 0), wheelR=0.48, extra={'cannons': [[1.6, 1.55, -0.7], [1.6, 1.55, 0.6], [-1.6, 1.55, -0.7], [-1.6, 1.55, 0.6]]})

if __name__ == '__main__':
    run('dusty_doubloon', build, level_overrides={'hi': dict(ico=1, bevel=2, cyl=24), 'lo': dict(ico=1)})
