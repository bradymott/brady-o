# Dusty Doubloon (Art Cart car #8): a pirate galleon that ran aground on dry land. On purpose. Quality-bar rebuild.
# A clear-coat lapstrake oak hull (baked plank shading in the vertex colours) riding a gloss-black trailer with chrome
# tube bumpers, amber under-glow and premium gold wheels; gold-leaf trim, glowing portholes, two billowing sails with
# glowing hearts, a swallow-tailed pennant, a grinning-sun figurehead, a chrome anchor and swinging stern lanterns.
# The captain steers a ship's wheel from the stern castle.
# Run it inside an open Blender (Blender 5.2 crashes headless on Brady's Mac):
#   import runpy; runpy.run_path('/abs/path/tools/blender/dusty_doubloon.py', run_name='__main__')
# Writes assets/models/art-cart/dusty_doubloon.glb (showroom, <= 30k tris) and dusty_doubloon_lo.glb (race, <= 7k).
#
# Rig (rigV 2, posed by CART_GLB_PARTS['galleon:2'] in src/43_cart_bb_glb.js):
#   part_hull                 everything that floats: hull, deck, castle, masts, cannons. Joint at the car origin; the
#                             game rocks it about a pivot at the captain's deck (cartGalleonRock), so the driver,
#                             who rides the body bone, stays put
#   part_sailFore / sailMain  the sails, joint at the sail's centre on the mast: they billow (z scale) with speed
#   part_flag                 the pennant at the main mast top, streaming back and fluttering
#   part_lanternL / lanternR  the stern lanterns, joint at their hook: they swing
#   The sails, flag and lanterns also ride the hull's rock (the pose maths moves their joints with it).
# body extras: rigV = 2, extra.sight = the main sail's top (the chase camera rises just enough to see over the rig).
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
# the rig, kept low so the chase camera sees over the main sail (see extra.sight)
FORE_Z, MAIN_Z = 1.0, -0.5
FORE_TOP, MAIN_TOP = 4.0, 4.75
SAIL_FORE = ((0, 3.1, FORE_Z + 0.08), 2.1, 1.2)          # pivot, width, height (2.5 .. 3.7)
SAIL_MAIN = ((0, 3.35, MAIN_Z + 0.08), 2.3, 1.4)         # (2.65 .. 4.05)
NEST_Y = 4.3
LANT = [(1.13, 3.28, -2.58), (-1.13, 3.28, -2.58)]       # the lantern hooks (left, right)

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
def heart(k, n=24): return heart_pts(n, k, 6 * k)
def oval_walk(R, step, a0=0.0, a1=TAU):
    """Points along the hull oval between the torus angles a0..a1, ~step apart: (a, x, z) in engine coords."""
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
    PL = dict(seg=2, phis=[-45, 0, 0, 45]) if lo else dict(seg=3)   # bm_pillow tessellation (rounded slabs)
    B.export_try = VCOL_EXPORT   # plank shading, canvas and castle gradients are vertex colours
    # everything that floats rides part_hull (joint at the car origin, so it's authored in car coordinates);
    # B.obj defaults to it, the trailer and wheels pass parent=body
    H = B.part('hull', (0, 0, 0))
    _obj = Build.obj
    def obj(name, bm, m, parent=None, **kw): return _obj(B, name, bm, m, parent=parent if parent is not None else H, **kw)
    B.obj = obj
    # ---- materials: clear-coat oak in three tones (the vertex colours shade the planks), gold leaf, gloss iron ----
    M_oak = paint('oak', '#c47a3a', coat=1.0, rough=0.24, metal=0.0)
    M_oak2 = paint('oak_dark', '#9a5426', coat=1.0, rough=0.26, metal=0.0)
    M_oak3 = paint('oak_deep', '#6a3818', coat=1.0, rough=0.28, metal=0.0)
    M_deck = matte('deck_teak', '#c88a52', 0.8)   # matte, so the flat deck doesn't mirror the sky
    M_band = paint('oxblood', '#9a1c20', coat=1.0, rough=0.2, metal=0.25)   # the painted gun-deck band
    M_plank = matte('plank_seam', '#2a1a0e')
    M_gold = metal('gold', COL2, 0.12); M_gold2 = metal('gold_dark', '#d0a040', 0.2)
    M_iron = paint('iron_gloss', '#24201e', coat=1.0, rough=0.25, metal=0.4); M_iron2 = metal('iron_dark', '#1a1614', 0.5)
    M_frame = paint('trailer_black', '#141214', coat=1.0, rough=0.2, metal=0.3)
    M_canvas = satin('canvas', '#fff4dc', 0.55); M_red = paint('band_red', '#d0302a', coat=0.6, rough=0.35, metal=0.0)
    M_rope = matte('rope', '#c8a868', 0.85)
    M_amber = glow('amber_glass', LIGHT, strength=2.6, rough=0.12)
    M_lantern = led(LIGHT, 4.0); M_sun = glow('sun_gold', COL2, strength=0.9, rough=0.15)
    M_pink = led(PINK, 3.0); M_coins = glow('coins', '#ffe08a', strength=1.6, rough=0.2)
    M_flag = paint('flag_dark', '#1a1a22', coat=0.5, rough=0.4, metal=0.0)
    M_seam = satin('sail_seam', '#b8a07a', 0.6)
    M_paintgold = paint('sail_gold', '#f2b632', coat=0.4, rough=0.45, metal=0.0)   # painted, not metal: it reads gold, not white
    M_star = paint('sail_star', '#5a1a14', coat=0.4, rough=0.5, metal=0.0)
    M_ledA, M_ledG = led(LIGHT, 4.0), led(COL2, 4.0)
    M_glass = mat('lamp_glass', '#2a2418', rough=0.04, extras={'burns_gloss': 3})
    def rivet(name, p, r=0.024, parent=None, m=M_gold):
        if lo: return
        B.obj(name, bm_ico(r, 0, p), m, parent=parent)
    def box_between(name, p0, p1, w, d, n, m, parent=None, bevel=None):
        """A box of width w and thickness d spanning the points p0 -> p1, its face along the normal n."""
        p0 = Vector(p0); p1 = Vector(p1); ay = p1 - p0; Ln = ay.length; ay.normalize(); az = Vector(n).normalized()
        ax = ay.cross(az); ax.normalize(); az = ax.cross(ay)
        c = (p0 + p1) / 2
        return B.obj(name, bm_box(w, Ln, d, tuple(c), M=frame(tuple(ax), tuple(ay), tuple(az))), m, parent=parent, bevel=bevel, bevel_angle=False)
    def plank_shade(y0, y1):
        """Vertex colour for a strake: a soft shadow under the lap above, sun-warmed on top, darker toward bow and stern."""
        ph = y0 * 7.3
        def f(x, y, z):
            t = sstep((y - y0) / max(1e-3, y1 - y0)); e = 1 - 0.18 * sstep((abs(z) - 1.6) / 1.4)
            a = math.atan2(z / SZ, x)   # board-by-board tone: each plank a slightly different oak, staggered strake to strake
            g = 0.9 + 0.07 * math.sin(a * 9 + ph) + 0.04 * math.sin(a * 23 + ph * 2.1)
            k = (0.64 + 0.36 * t) * e * g
            return (k * 1.03, k * 0.97, k * 0.9)
        return f

    # ================= hull: lapstrake oak strakes (hi) or one smooth lathe (lo), a dark keel and bottom =================
    seg = B.pick(28, 16)
    hull = []
    if lo:
        hb = B.obj('hull_shell', bm_lathe([(hull_r(h), h) for h in (0.0, 0.25, 0.55, 0.8, 1.05, 1.2, 1.3)], seg, at=(0, HULL_Y, 0), sz=SZ), [M_oak, M_band],
                   face_mat=lambda f: 1 if 0.8 + HULL_Y < f.calc_center_median().z < 1.05 + HULL_Y else 0)
        B.vcol(hb, lambda x, y, z: tuple(c * (0.68 + 0.32 * sstep((y - 0.6) / 1.2)) * (1 - 0.15 * sstep((abs(z) - 1.6) / 1.4)) * (0.92 + 0.08 * math.sin(math.atan2(z / SZ, x) * 9 + y * 6)) for c in (1.03, 0.97, 0.9)))
        hull.append(hb)
    else:
        for i, (h0, h1) in enumerate(zip(BANDS, BANDS[1:])):
            wale = i == len(BANDS) - 2; lip = 0.05 if wale else LIP
            prof = [(hull_r(h0) + lip * 0.55, h0 - 0.022), (hull_r(h0) + lip, h0 - 0.005), (hull_r(h0) + lip, h0 + 0.03)]
            rows = 2
            for k in range(1, rows + 1):
                h = h0 + 0.03 + (h1 - h0 - 0.03) * k / rows
                prof.append((hull_r(h) + lip * (1 - k / rows) * 0.25, h))
            st = B.obj('strake_%d' % i, bm_lathe(prof, seg, at=(0, HULL_Y, 0), sz=SZ), M_oak3 if wale else (M_band if i == 3 else M_oak if i % 2 else M_oak2))
            B.vcol(st, plank_shade(HULL_Y + h0, HULL_Y + h1))
            hull.append(st)
    B.obj('keel_plate', bm_lathe([(0, -0.05), (0.5, -0.04), (0.6, 0.0)], B.pick(24, 10), at=(0, HULL_Y, 0), sz=SZ), M_iron2)
    B.obj('keel', bm_box(0.16, 0.2, 3.4, (0, 0.56, 0)), M_iron2, bevel=B.pick(0.03, None), bevel_angle=False, segments=1)
    # wheel wells cut into the lower strakes, with a gold arch ring
    for i, (x, z) in enumerate([(1.1, 1.9), (-1.1, 1.9), (1.1, -1.9), (-1.1, -1.9)]):
        B.cut(hull if lo else hull[:3], bm_cyl(0.6, 0.6, 0.9, L['arch'], AX, (x, 0.48, z)), 'arch_%d' % i)
        B.obj('arch_ring_%d' % i, bm_torus(0.62, B.pick(0.035, 0.03), B.pick(10, 6), 3, AX, (x * 0.95, 0.48, z), sweep=(math.pi / 2, 3 * math.pi / 2)), M_gold)

    # ================= the trailer it ran aground on (body bone): gloss-black rails, chrome tube bumpers, amber under-glow =================
    for s in (1, -1):
        B.obj('rail_%d' % (s > 0), bm_capsule(0.075, 4.9, B.pick(10, 6), B.pick(3, 1), (s * 0.7, 0.5, -0.1), AZ), M_frame, parent=body)
        for z in (1.0, -1.0):
            if not lo: B.obj('chock_%d_%d' % (s > 0, z > 0), bm_capsule(0.085, 0.34, 8, 2, (s * 0.7, 0.64, z), AZ), M_iron, parent=body)
        B.strip((s * 0.62, 0.36, 2.1), (s * 0.62, 0.36, -2.3), LIGHT, th=0.04, parent=body)
        B.light(s * 0.65, 0.25, 0.0, 2.2, LIGHT, led=1)
    for z in (1.9, -1.9):
        B.obj('axle_%d' % (z > 0), bm_rod((-1.05, 0.48, z), (1.05, 0.48, z), 0.045, L['rod']), dark_chrome(), parent=body)
        B.obj('axle_hs_%d' % (z > 0), bm_rod((-0.78, 0.48, z), (0.78, 0.48, z), 0.075, L['rod']), M_frame, parent=body)
    B.obj('bar_front', bm_pillow(1.7, 0.2, 0.16, 0.07, seg=3, phis=[-50, -20, 0, 0, 20, 50], at=(0, 0.6, 2.36)) if not lo else bm_capsule(0.09, 1.7, 6, 1, (0, 0.6, 2.36), AX), M_frame, parent=body)
    B.obj('bar_rear', bm_pillow(1.7, 0.2, 0.16, 0.07, **(PL if lo else dict(seg=3, phis=[-50, -20, 0, 0, 20, 50])), at=(0, 0.6, -2.5)), M_frame, parent=body)
    for zs, zc in ((1, 2.62), (-1, -2.76)):
        path = catmull([(1.08, 0.58, zc - zs * 0.48), (0.98, 0.58, zc - zs * 0.12), (0.6, 0.58, zc), (-0.6, 0.58, zc), (-0.98, 0.58, zc - zs * 0.12), (-1.08, 0.58, zc - zs * 0.48)], B.pick(14, 7))
        B.obj('bumper_%d' % (zs > 0), bm_tube(path, 0.06, B.pick(7, 6)), chrome(), parent=body)
        if not lo:
            for s in (): B.obj('overrider_%d_%d' % (zs > 0, s > 0), bm_capsule(0.045, 0.26, 8, 2, (s * 0.38, 0.62, zc + zs * 0.02)), chrome(), parent=body)
    B.strip((-0.6, 0.36, 2.45), (0.6, 0.36, 2.45), LIGHT, th=0.04, parent=body); B.strip((-0.6, 0.36, -2.6), (0.6, 0.36, -2.6), LIGHT, th=0.04, parent=body)
    # headlights: chrome-bezelled lamps on the front bar; tail lamps in chrome rings on the rear bar
    for s in (1, -1):
        hx = s * 0.6
        B.obj('head_cup_%d' % (s > 0), bm_closed_lathe([(0, -0.06), (0.13, -0.05), (0.14, 0.0), (0.0, 0.01)], L['cyl_s'], AZ, (hx, 0.82, 2.4)), dark_chrome(), parent=body)
        B.obj('head_bezel_%d' % (s > 0), bm_torus(0.135, 0.024, B.pick(12, 6), 3, AZ, (hx, 0.82, 2.41)), chrome(), parent=body)
        B.obj('head_lens_%d' % (s > 0), bm_ellipsoid(0.11, 0.03, 0.11, B.pick(12, 8), B.pick(3, 2), (hx, 0.82, 2.405), phi1=math.pi / 2, M=AZ), led('#fff0d8'), parent=body)
        B.obj('head_post_%d' % (s > 0), bm_rod((hx, 0.66, 2.38), (hx, 0.72, 2.38), 0.03, 6), chrome(), parent=body)
        B.light(hx, 0.82, 2.5, 1.3, '#fff2c8', head=1)
        B.obj('tail_ring_%d' % (s > 0), bm_rrect_tube(0.36, 0.12, 0.05, 0.014, B.pick(2, 1), B.pick(4, 3), at=(s * 0.55, 0.62, -2.585), axis=AZn), chrome(), parent=body)
        B.obj('tail_%d' % (s > 0), bm_capsule(0.042, 0.32, B.pick(10, 5), B.pick(2, 1), (s * 0.55, 0.62, -2.585), AX), led('#ff1a2a'), parent=body)
        B.light(s * 0.55, 0.62, -2.7, 0.9, '#ff2a3a', tail=1)

    # ================= gunwale: gold rail, gold wale trim, the deck, plank seams, a baluster railing =================
    B.obj('gunwale', bm_torus(1.3, 0.055, B.pick(32, 16), B.pick(4, 3), AY, (0, GUNWALE, 0), sy=SZ), M_gold)
    if not lo: B.obj('wale_trim', bm_torus(hull_r(1.05) + 0.06, 0.026, 28, 3, AY, (0, HULL_Y + 1.03, 0), sy=SZ), M_gold2)
    B.obj('deck', ring_disc(1.265, DECK - 0.04, DECK, seg, at=(0, HULL_Y, 0)), M_deck)
    if not lo:
        for k in range(6):
            for s in (1, -1):
                x = s * (0.11 + 0.22 * k); zl = 2 * SZ * 1.265 * math.sqrt(max(0.0, 1 - (x / 1.265) ** 2)) - 0.12
                B.obj('deck_seam_%d_%d' % (s > 0, k), bm_box(0.014, 0.008, zl, (x, DECK + 0.001, 0)), M_plank, smooth=False)
        for a, x, z in oval_walk(1.3, 1.1, math.radians(155), math.radians(385)):
            B.obj('baluster_%d' % int(math.degrees(a)), bm_lathe([(0.02, 0), (0.032, 0.06), (0.018, 0.17), (0.026, 0.34)], 5, at=(x, GUNWALE + 0.03, z)), M_oak3)
        B.obj('toprail', bm_torus(1.3, 0.03, 28, 3, AY, (0, GUNWALE + 0.38, 0), sweep=(math.radians(155), math.radians(385)), sy=SZ), M_oak)
    # LED rope-light along the gunwale: amber and gold bulbs riding on the rail
    bulbs = [(a, x, z) for a, x, z in oval_walk(1.335, B.pick(0.7, 1.5)) if z > -1.7 or abs(x) > 1.05]
    for i, (a, x, z) in enumerate(bulbs):
        B.obj('rope_led_%d' % i, bm_uv(0.05, B.pick(7, 6), 4, (x, GUNWALE + 0.07, z)) if not lo else bm_ico(0.05, L['ico'], (x, GUNWALE + 0.07, z)), M_ledA if i % 2 else M_ledG)
        if i % B.pick(6, 4) == 0: B.light(x, GUNWALE + 0.1, z, 0.5, LIGHT if i % 2 else COL2, led=1)

    # ================= iron strapping down the strakes with gold rivets (hi) =================
    if not lo:
        for s in (1, -1):
            for zi, z in enumerate((0.0,)):
                for i, (h0, h1) in enumerate(zip(BANDS[1:], BANDS[2:])):
                    y0, y1 = HULL_Y + h0 + 0.04, HULL_Y + h1 - 0.01
                    p0 = Vector((s * hull_x(y0, z, LIP), y0, z)); p1 = Vector((s * hull_x(y1, z, 0.01), y1, z))
                    n = hull_n(p0[0], (y0 + y1) / 2, z)
                    B.obj('strap_%d_%d_%d' % (s > 0, zi, i), bm_tube([tuple(p0), tuple(p1)], 0.045, 6, section_fn=lambda u: (0.45, 1.0), ref=tuple(n)), M_iron)
    # ================= portholes: gold ring, amber glass, aimed along the hull normal =================
    def window(name, p, n, R):
        p = Vector(p); n = Vector(n).normalized(); A = aim(tuple(n))
        if lo:
            B.obj(name + '_ring', bm_torus(R + 0.02, 0.03, 6, 3, A, tuple(p + n * 0.015)), M_gold)
            B.obj(name + '_glass', bm_ellipsoid(R, 0.03, R, 6, 2, tuple(p + n * 0.01), M=A, phi1=math.pi / 2), M_amber)
        else:
            B.obj(name + '_ring', bm_torus(R + 0.015, 0.03, 8, 3, A, tuple(p + n * 0.02)), M_gold)
            B.obj(name + '_glass', bm_ellipsoid(R, 0.035, R, 12, 2, tuple(p + n * 0.012), M=A, phi1=math.pi / 2), M_amber)
    for s in (1, -1):
        for i, z in enumerate((-1.5, -0.5, 0.5, 1.5)):
            if lo and i % 2: continue   # the race level keeps every other porthole
            x = s * hull_x(1.25, z, 0.03); n = hull_n(x, 1.25, z); p = Vector((x, 1.25, z))
            window('port_%d_%d' % (s > 0, i), p, n, 0.115)
    # ================= cannons: gloss-black barrels with chrome rings through gold-framed gun ports, lids propped open =================
    for s in (1, -1):
        for i, z in enumerate((-0.7, 0.6)):
            x0 = hull_x(1.55, z, LIP + 0.01)
            if not lo: B.obj('port_recess_%d_%d' % (s > 0, i), bm_box(0.1, 0.36, 0.36, (s * (x0 - 0.04), 1.55, z)), M_iron2, smooth=False)
            cprof = [(0.0, -0.1), (0.15, -0.08), (0.14, 0.05), (0.13, 0.35), (0.11, 0.62), (0.125, 0.66), (0.12, 0.7), (0.0, 0.7)] if not lo else [(0.0, -0.1), (0.15, -0.08), (0.11, 0.66), (0.12, 0.7), (0.0, 0.7)]
            B.obj('cannon_%d_%d' % (s > 0, i), bm_lathe(cprof, B.pick(8, 6), axis=AX if s > 0 else AXn, at=(s * (x0 - 0.12), 1.55, z), caps=False), M_iron)
            B.obj('cannon_muzzle_%d_%d' % (s > 0, i), bm_torus(0.105, 0.03, B.pick(8, 6), 3, AX, (s * (x0 + 0.56), 1.55, z)), chrome())
            if not lo:
                B.obj('cannon_bore_%d_%d' % (s > 0, i), bm_cyl(0.075, 0.075, 0.02, 8, AX, (s * (x0 + 0.585), 1.55, z)), M_iron2)
                B.obj('port_frame_%d_%d' % (s > 0, i), bm_rrect_tube(0.44, 0.44, 0.08, 0.022, 2, 3, at=(s * (x0 + 0.005), 1.55, z), axis=AX), M_gold2)
                th = math.radians(100); u = (s * math.sin(th), math.cos(th), 0)
                hinge = Vector((s * (x0 + 0.02), 1.78, z)); c = hinge + Vector(u) * 0.19
                n = Vector((0, 0, 1)).cross(Vector(u)); n.normalize()
                B.obj('port_lid_%d_%d' % (s > 0, i), bm_box(0.4, 0.38, 0.035, tuple(c), M=frame((0, 0, 1), u, tuple(n))), M_oak2, bevel=0.012, bevel_angle=False, segments=1)
                if False: rivet('lid_rv_%d_%d_%d' % (s > 0, i, k > 0), tuple(c + Vector((0, 0, k * 0.15)) + n * 0.02 * (-s)), 0.02)

    # ================= stern castle: a rounded oak cabin, gold trim, iron corner straps, round windows, a door =================
    castle = B.obj('castle', bm_pillow(2.0, 0.9, 1.2, 0.12, **PL, at=(0, 2.1, -1.9)), M_oak2)
    B.vcol(castle, lambda x, y, z: tuple(c * (0.66 + 0.34 * sstep((y - 1.65) / 0.95)) for c in (1.02, 0.97, 0.9)))
    B.obj('castle_trim', bm_rrect_tube(2.02, 1.22, 0.14, 0.045, B.pick(3, 1), B.pick(6, 3), at=(0, 2.56, -1.9)), M_gold)
    B.obj('castle_trim_lo', bm_rrect_tube(2.02, 1.22, 0.14, 0.035, B.pick(3, 1), B.pick(5, 3), at=(0, 1.7, -1.9)), M_gold2)
    if not lo: B.obj('castle_deck', bm_pillow(1.9, 0.05, 1.12, 0.024, seg=B.pick(3, 2), phis=[-45, 0, 0, 45], at=(0, 2.62, -1.9)), M_deck)
    for s in (1, -1):
        for zi, z in enumerate((-1.3, -2.5)):
            cz = z - 0.035 if z > -1.9 else z + 0.035   # on the rounded corner of the cabin
            B.obj('castle_strap_%d_%d' % (s > 0, zi), bm_capsule(0.042, 0.84, B.pick(6, 5), B.pick(2, 1), (s * 0.965, 2.1, cz)), M_iron)
        for zi, z in enumerate((-1.95,) if not lo else ()): window('swin_%d_%d' % (s > 0, zi), (s * 1.0, 2.15, z), (s, 0, 0), 0.12)
        B.obj('corbel_%d' % (s > 0), bm_rod((s * (hull_x(1.4, -2.25) - 0.05), 1.3, -2.25), (s * 0.95, 1.68, -2.35), 0.05, L['rod']), M_oak3)
    for xi, x in enumerate((-0.55, 0.0, 0.55)): window('win_%d' % xi, (x, 2.15, -2.5), (0, 0, -1), 0.13)
    if not lo:
        for y in (1.9, 2.4):
            B.obj('castle_seam_b_%d' % int(y * 10), bm_box(1.66, 0.014, 0.012, (0, y, -2.505)), M_plank, smooth=False)
            for s in (1, -1): B.obj('castle_seam_s_%d_%d' % (s > 0, int(y * 10)), bm_box(0.012, 0.014, 0.9, (s * 1.005, y, -1.9)), M_plank, smooth=False)
        B.obj('door', bm_pillow(0.36, 0.56, 0.05, 0.022, seg=3, phis=[-45, 0, 0, 45], at=(0.5, 1.96, -1.29)), M_oak3)
        B.obj('door_frame', bm_rrect_tube(0.4, 0.6, 0.06, 0.016, 2, 4, at=(0.5, 1.96, -1.275), axis=AZ), M_gold)
        B.obj('door_knob', bm_ico(0.028, 1, (0.62, 1.96, -1.26)), M_gold)
    # stern-deck railing: gold rail on turned oak posts around the back and sides
    for s in (1, -1):
        for z in (-1.4, -1.95):
            B.obj('srail_post_%d_%d' % (s > 0, int(-z * 10)), bm_rod((s * 0.95, 2.63, z), (s * 0.95, 2.95, z), 0.024, 6), M_oak3)
        B.obj('srail_side_%d' % (s > 0), bm_rod((s * 0.95, 2.95, -1.38), (s * 0.95, 2.95, -2.45), 0.026, B.pick(8, 5)), M_gold)
    for x in (-0.5, 0.5): B.obj('srail_post_b_%d' % (x > 0), bm_rod((x, 2.63, -2.45), (x, 2.95, -2.45), 0.024, 6), M_oak3)
    B.obj('srail_back', bm_rod((-0.95, 2.95, -2.45), (0.95, 2.95, -2.45), 0.026, B.pick(8, 5)), M_gold)
    # lantern goosenecks on the stern corners: an iron post curling up and out to the hook (the lanterns are parts)
    for s in (1, -1):
        hx, hy, hz = LANT[0 if s > 0 else 1]
        neck = catmull([(s * 0.95, 2.62, -2.45), (s * 0.95, 3.1, -2.45), (s * 0.98, 3.36, -2.5), (s * 1.08, 3.38, -2.56), (hx, hy + 0.04, hz)], B.pick(10, 5))
        B.obj('gooseneck_%d' % (s > 0), bm_tube(neck, 0.024, B.pick(6, 4)), M_iron)
        if not lo: B.obj('gooseneck_knob_%d' % (s > 0), bm_ico(0.04, 1, (s * 0.95, 2.97, -2.45)), M_gold)
    def lantern(name, hook):
        """A hanging ship's lantern on part `name`, joint at the hook: ring, cap, amber glass in an iron cage, a base."""
        P = B.part(name, hook)
        if not lo: B.obj(name + '_ring', bm_torus(0.035, 0.012, 10, 4, AZ, (0, -0.03, 0)), M_gold, parent=P)
        B.obj(name + '_cap', bm_closed_lathe([(0, -0.07), (0.13, -0.17), (0.12, -0.19), (0.0, -0.19)], B.pick(10, 8), AY, (0, 0, 0)), M_iron, parent=P)
        B.obj(name + '_glass', bm_closed_lathe([(0, -0.19), (0.09, -0.2), (0.11, -0.3), (0.1, -0.42), (0.0, -0.44)], B.pick(10, 8), AY, (0, 0, 0)), M_lantern, parent=P)
        B.obj(name + '_base', bm_closed_lathe([(0, -0.43), (0.12, -0.43), (0.12, -0.47), (0.04, -0.52), (0, -0.53)], B.pick(10, 8), AY, (0, 0, 0)), M_iron, parent=P)
        if not lo:
            for k in range(4):
                a = k / 4 * TAU + math.pi / 4
                B.obj(name + '_bar_%d' % k, bm_tube(catmull([(math.cos(a) * 0.115, -0.18, math.sin(a) * 0.115), (math.cos(a) * 0.125, -0.31, math.sin(a) * 0.125), (math.cos(a) * 0.115, -0.44, math.sin(a) * 0.115)], 5), 0.011, 4), M_gold2, parent=P)
            B.obj(name + '_band', bm_torus(0.118, 0.01, 12, 3, AY, (0, -0.31, 0)), M_gold2, parent=P)
        return P
    for k, nm in enumerate(('lanternL', 'lanternR')):
        hx, hy, hz = LANT[k]; lantern(nm, LANT[k]); B.light(hx, hy - 0.31, hz, 1.4, LIGHT)

    # ================= a parrot on the stern rail, keeping the captain company (showroom) =================
    if not lo:
        px, py, pz = 0.55, 2.98, -2.45
        M_pg, M_pr, M_py = paint('parrot_green', '#2ac85a', coat=1.0, rough=0.25, metal=0.0), paint('parrot_red', '#e8302a', coat=1.0, rough=0.25, metal=0.0), paint('parrot_beak', '#ffc83a', coat=0.6, rough=0.3, metal=0.0)
        B.obj('parrot_body', bm_ellipsoid(0.09, 0.15, 0.1, 10, 6, (px, py + 0.15, pz), M=rot(pitch=-0.25)), M_pg)
        B.obj('parrot_head', bm_uv(0.075, 10, 6, (px, py + 0.32, pz + 0.04)), M_pr)
        B.obj('parrot_beak', bm_cyl(0.035, 0.0, 0.08, 8, aim((0, -0.5, 1)), (px, py + 0.3, pz + 0.12)), M_py)
        for s in (1, -1):
            B.obj('parrot_wing_%d' % (s > 0), bm_ellipsoid(0.03, 0.12, 0.08, 8, 4, (px + s * 0.08, py + 0.14, pz - 0.01), M=rot(pitch=-0.35, roll=s * 0.2)), paint('parrot_blue', '#2a6ae8', coat=1.0, rough=0.25, metal=0.0))
            B.obj('parrot_eye_%d' % (s > 0), bm_uv(0.016, 6, 3, (px + s * 0.05, py + 0.34, pz + 0.08)), M_iron2)
        B.obj('parrot_tail', bm_box(0.06, 0.2, 0.02, (px, py + 0.02, pz - 0.1), M=rot(pitch=0.5)), M_pr, bevel=0.008, bevel_angle=False, segments=1)
    # ================= helm: an oak post up from the main deck, the ship's wheel on the steer bone =================
    B.obj('helm_post', bm_lathe([(0.0, -0.53), (0.12, -0.53), (0.12, -0.45), (0.085, -0.38), (0.09, 0.1), (0.075, 0.38), (0.1, 0.46), (0.1, 0.53), (0.0, 0.53)] if not lo else [(0.0, -0.53), (0.11, -0.53), (0.085, 0.4), (0.0, 0.53)], B.pick(12, 6), at=(0, 2.33, -1.15), caps=False), M_oak3)
    B.obj('helm_cap', bm_closed_lathe([(0, -0.025), (0.12, -0.025), (0.135, 0.0), (0.11, 0.025), (0, 0.03)] if not lo else [(0, -0.025), (0.13, 0.0), (0, 0.03)], B.pick(14, 8), AY, (0, 2.87, -1.15)), M_gold2)
    for s in (1, -1): B.obj('helm_fork_%d' % (s > 0), bm_rod((s * 0.08, 2.88, -1.3), (s * 0.08, 3.2, -1.3), 0.025, 6), M_iron)
    B.obj('helm_axle', bm_rod((0, 3.2, -1.34), (0, 3.2, -1.1), 0.035, L['rod']), dark_chrome())
    B.obj = lambda name, bm, m, parent=None, **kw: _obj(B, name, bm, m, parent=parent if parent is not None else body, **kw)
    st = B.seat_pro(0, 3.02, -1.85, col='#4a2a16', accent=COL2, wheelY=3.2, wheelZ=-1.2, tilt=0.15, column=False, piping=COL2, wheel=False)
    B.obj = obj
    B.obj('wheel_rim', bm_torus(0.34, 0.038, B.pick(20, 10), B.pick(4, 3), AZ, (0, 0, 0)), M_oak2, parent=st)
    if not lo: B.obj('wheel_rim_gold', bm_torus(0.34, 0.013, 22, 3, AZ, (0, 0, 0.04)), M_gold, parent=st)
    B.obj('wheel_hub', bm_closed_lathe([(0, -0.05), (0.07, -0.045), (0.08, 0.0), (0.06, 0.045), (0, 0.06)] if not lo else [(0, -0.05), (0.08, 0.0), (0, 0.06)], B.pick(12, 6), AZ), M_gold, parent=st)
    for k in range(B.pick(8, 4)):
        a = k / B.pick(8, 4) * TAU; c, s_ = math.cos(a), math.sin(a)
        B.obj('wheel_spoke_%d' % k, bm_rod((c * 0.06, s_ * 0.06, 0), (c * 0.47, s_ * 0.47, 0), 0.022, B.pick(7, 4)), M_oak, parent=st)
        if not lo: B.obj('wheel_handle_%d' % k, bm_capsule(0.028, 0.12, 6, 2, (c * 0.47, s_ * 0.47, 0), axis=aim((c, s_, 0))), M_gold, parent=st)

    # ================= bowsprit and the grinning-sun figurehead on the bow =================
    B.obj('bowsprit', bm_rod((0, 1.9, 2.6), (0, 2.35, 3.6), 0.09, L['rod'], r1=0.05), M_oak2)
    if not lo:
        for t in (0.5,): B.obj('bowsprit_band_%d' % int(t * 10), bm_torus(0.09 - 0.03 * t, 0.016, 10, 4, aim((0, 0.45, 1.0)), (0, 1.9 + 0.45 * t, 2.6 + t)), M_gold)
    B.obj('bowsprit_tip', bm_ico(0.07, B.pick(2, 1), (0, 2.36, 3.62)), M_gold)
    sunp = (0, 1.85, 3.1)
    B.obj('sun_plinth', bm_cyl(0.27, 0.3, 0.3, B.pick(20, 10), AZ, (0, 1.85, 2.88)), M_oak3)
    B.obj('sun_disc', bm_closed_lathe([(0, -0.1), (0.3, -0.1), (0.34, -0.04), (0.33, 0.04), (0.28, 0.09), (0.15, 0.115), (0, 0.12)], B.pick(20, 8), AZ, sunp), M_sun)
    nray = B.pick(12, 6)
    for k in range(nray):
        a = k / nray * TAU + math.pi / nray; c, s_ = math.cos(a), math.sin(a)
        pts = [(c * 0.28 - s_ * 0.08, s_ * 0.28 + c * 0.08), (c * 0.55, s_ * 0.55), (c * 0.28 + s_ * 0.08, s_ * 0.28 - c * 0.08)]
        B.obj('sun_ray_%d' % k, bm_profile(pts, 0.08, (0, 1.85, 3.06)), M_gold)
    for s in (1, -1):
        B.obj('sun_eye_%d' % (s > 0), bm_ellipsoid(0.045, 0.06, 0.03, B.pick(8, 6), B.pick(4, 3), (s * 0.12, 1.94, 3.215)), M_iron2)
        if not lo: B.obj('sun_cheek_%d' % (s > 0), bm_ellipsoid(0.06, 0.04, 0.02, 8, 3, (s * 0.2, 1.82, 3.2)), led('#ff9a6a', 1.5))
    B.obj('sun_grin', bm_torus(0.17, 0.03, B.pick(12, 7), B.pick(5, 3), AZ, (0, 1.84, 3.21), sweep=(math.pi * 1.12, math.pi * 1.88)), M_iron2)
    B.obj('sun_nose', bm_ico(0.04, 1, (0, 1.87, 3.23)), M_gold2)
    # ================= the chrome anchor hanging off the port bow on a chain =================
    AY_, AZ_ = 1.5, 2.6
    ap = Vector((hull_x(AY_, AZ_, 0.06), AY_, AZ_)); n = hull_n(ap.x, AY_, AZ_); ap = ap + n * 0.07
    ax = Vector((0, 1, 0)).cross(n); ax.normalize()
    FA = frame(tuple(ax), (0, 1, 0), tuple(n))
    def apt(lx, ly, lz=0.0): return tuple(ap + ax * lx + Vector((0, ly, 0)) + n * lz)
    B.obj('anchor_shank', bm_rod(apt(0, 0.1), apt(0, -0.6), 0.03, L['rod']), chrome())
    B.obj('anchor_stock', bm_rod(apt(-0.24, -0.02), apt(0.24, -0.02), 0.028, L['rod']), chrome())
    B.obj('anchor_ring', bm_torus(0.065, 0.016, B.pick(12, 8), B.pick(5, 3), FA, apt(0, 0.16)), chrome())
    B.obj('anchor_arms', bm_torus(0.22, 0.03, B.pick(14, 7), B.pick(5, 3), FA, apt(0, -0.38), sweep=(math.pi * 1.15, math.pi * 1.85)), chrome())
    for sgn in (-1, 1):
        fl = [(sgn * 0.18, -0.53), (sgn * 0.31, -0.44), (sgn * 0.2, -0.68)] if sgn > 0 else [(sgn * 0.18, -0.53), (sgn * 0.2, -0.68), (sgn * 0.31, -0.44)]
        B.obj('anchor_fluke_%d' % (sgn > 0), bm_profile(fl, 0.05, tuple(ap), M=FA), chrome(), bevel=B.pick(0.012, None), bevel_angle=False, segments=1)
    if not lo:
        top = Vector((hull_x(GUNWALE, AZ_, 0.1), GUNWALE + 0.1, AZ_)); bot = Vector(apt(0, 0.22))
        for k in range(3):
            c = bot + (top - bot) * ((k + 0.5) / 3)
            B.obj('chain_%d' % k, bm_torus(0.035, 0.011, 8, 3, aim(tuple(ax if k % 2 else n)), tuple(c)), chrome())

    # ================= masts, crow's nest, rigging =================
    def mast(name, z, top):
        B.obj(name, bm_rod((0, 1.6, z), (0, top, z), 0.1, B.pick(14, 7), r1=0.065), M_oak)
        B.obj(name + '_collar', bm_torus(0.13, 0.032, B.pick(14, 8), B.pick(4, 3), AY, (0, DECK + 0.02, z)), M_gold)
        B.obj(name + '_finial', bm_ico(0.09, B.pick(2, 1), (0, top + 0.05, z)), M_gold)
        if not lo:
            for yb in (2.4,):
                B.obj(name + '_band_%d' % int(yb * 10), bm_torus(0.1 - 0.035 * (yb - 1.6) / (top - 1.6), 0.016, 12, 3, AY, (0, yb, z)), M_gold2)
    mast('mast_fore', FORE_Z, FORE_TOP); mast('mast_main', MAIN_Z, MAIN_TOP)
    cn = (0, NEST_Y, MAIN_Z)
    B.obj('nest_out', bm_lathe([(0.24, -0.13), (0.29, -0.06), (0.31, 0.13)], B.pick(18, 10), at=cn, caps=False), M_oak2)
    B.obj('nest_in', bm_lathe([(0.22, -0.11), (0.27, -0.05), (0.29, 0.13)], B.pick(18, 10), at=cn, caps=False, flip=True), M_oak3)
    B.obj('nest_floor', bm_cyl(0.25, 0.25, 0.03, B.pick(18, 10), AY, (0, NEST_Y - 0.13, MAIN_Z)), M_oak3)
    B.obj('nest_hoop', bm_torus(0.31, 0.022, B.pick(18, 10), B.pick(4, 3), AY, (0, NEST_Y + 0.13, MAIN_Z)), M_gold)
    B.obj('flagpole', bm_rod((0, MAIN_TOP, MAIN_Z), (0, MAIN_TOP + 0.3, MAIN_Z), 0.03, 6, r1=0.02), M_oak3)
    rig = [((0, FORE_TOP - 0.25, FORE_Z), (s * (hull_x(GUNWALE, z) + 0.03), GUNWALE + 0.02, z)) for s in (1, -1) for z in (1.6, 0.5)]
    rig += [((0, NEST_Y - 0.15, MAIN_Z), (s * (hull_x(GUNWALE, z) + 0.03), GUNWALE + 0.02, z)) for s in (1, -1) for z in (-0.9, -1.25)]
    rig += [((0, FORE_TOP, FORE_Z), (0, 2.3, 3.5)), ((0, MAIN_TOP - 0.1, MAIN_Z), (0, FORE_TOP, FORE_Z))]
    for i, (a, b) in enumerate(rig if not lo else rig[-2:] + rig[:4:3] + rig[4:8:3]): B.obj('rig_%d' % i, bm_rod(a, b, 0.012, 4), M_rope)
    # ================= deck furniture: hatch grating, barrel, treasure chest, rope coils =================
    B.obj('hatch', bm_pillow(0.7, 0.1, 0.6, 0.04, **(PL if lo else dict(seg=3, phis=[-50, -20, 0, 0, 20, 50])), at=(0, DECK + 0.04, 0.2)), M_oak3)
    if not lo: B.obj('hatch_trim', bm_rrect_tube(0.7, 0.6, 0.06, 0.025, B.pick(2, 1), B.pick(5, 3), at=(0, DECK + 0.095, 0.2)), M_gold2)
    if not lo:
        for k in range(5): B.obj('hatch_slat_%d' % k, bm_box(0.6, 0.02, 0.05, (0, DECK + 0.115, 0.2 - 0.22 + k * 0.11)), M_plank, smooth=False)
    bp = (0.85, DECK, 0.3)
    B.obj('barrel', bm_lathe([(0.15, 0), (0.18, 0.12), (0.19, 0.22), (0.18, 0.32), (0.15, 0.44)], B.pick(16, 6), at=bp), M_oak2)
    if not lo:
        for hy in (0.09, 0.35): B.obj('barrel_hoop_%d' % int(hy * 100), bm_torus(0.185, 0.014, 12, 3, AY, (bp[0], bp[1] + hy, bp[2])), M_gold2)
    cp = (-0.8, DECK, 0.3)
    B.obj('chest', bm_pillow(0.55, 0.3, 0.4, 0.05, seg=2, phis=[-50, -20, 0, 0, 20, 50] if not lo else [-45, 0, 0, 45], at=(cp[0], cp[1] + 0.15, cp[2]), crown=0.0 if not lo else 0.08), M_oak2)
    if not lo:
        B.obj('chest_lid', bm_pillow(0.57, 0.1, 0.42, 0.045, seg=2, phis=[-50, -20, 0, 0, 20, 50], at=(0, 0, 0), M=Matrix.Translation(E(cp[0], cp[1] + 0.5, cp[2] - 0.32)) @ frame((1, 0, 0), (0, 0.42, 0.91), (0, -0.91, 0.42)), crown=0.04), M_oak2)
        B.obj('chest_coins', bm_ellipsoid(0.25, 0.12, 0.17, 12, 4, (cp[0], cp[1] + 0.3, cp[2]), phi1=math.pi / 2), M_coins)
    if not lo:
        for k in range(4):
            a = k * 2.4; B.obj('coin_%d' % k, bm_cyl(0.045, 0.045, 0.012, 8, rot(pitch=0.6 + k * 0.3, roll=a), (cp[0] + math.cos(a) * 0.14, cp[1] + 0.4 + 0.015 * k, cp[2] + math.sin(a) * 0.09)), M_gold)
    if not lo:
        for zz in (-0.12, 0.12): B.obj('chest_strap_%d' % (zz > 0), bm_pillow(0.57, 0.31, 0.035, 0.015, seg=2, phis=[-45, 0, 0, 45], at=(cp[0], cp[1] + 0.15, cp[2] + zz)), M_gold2)
        B.obj('chest_lock', bm_pillow(0.08, 0.1, 0.035, 0.015, seg=2, phis=[-45, 0, 0, 45], at=(cp[0], cp[1] + 0.2, cp[2] + 0.21)), M_gold)
    B.light(cp[0], cp[1] + 0.4, cp[2], 0.8, '#ffe08a', led=1)
    if not lo:
        for rp in ((0.75, DECK, 1.55),):
            coil = [(rp[0] + math.cos(t) * (0.08 + 0.13 * t / (5 * TAU)), rp[1] + 0.03 + 0.012 * math.sin(t * 3), rp[2] + math.sin(t) * (0.08 + 0.13 * t / (5 * TAU))) for t in (i / 22 * 4 * TAU for i in range(23))]
            B.obj('coil_%d' % (rp[0] > 0), bm_tube(coil, 0.03, 4), M_rope)

    # ================= the sails (parts): two-sided canvas billowing forward, a red band, yards, a glowing heart =================
    def sail(name, pivot, w, h):
        P = B.part(name, pivot); nu, nv = B.pick(14, 7), B.pick(9, 5)
        def sheet(u, v, off=0.0, v0=0.0, v1=1.0):
            v = v0 + (v1 - v0) * v
            x = (u - 0.5) * w * (1 - (1 - v) * 0.1); y = (v - 0.5) * h
            z = 0.4 * math.sin(u * math.pi) * (0.55 + 0.45 * math.sin(v * math.pi)) + 0.03 * math.sin(u * 4 * math.pi) * math.sin(v * math.pi) + off
            return (x, y, z)
        canvas = lambda x, y, z: tuple(c * (0.8 + 0.2 * math.sin(min(1, max(0, x / w + 0.5)) * math.pi) * math.sin(min(1, max(0, y / h + 0.5)) * math.pi)) for c in (1.0, 0.97, 0.9))
        def canvas_back(x, y, z):
            # the side the pack sees: two-tone (sun-bleached cream above the band, weathered tan below), the belly lit,
            # the edges and the leech shaded, and the canvas panels alternating faintly in tone
            u = min(1, max(0, x / w + 0.5)); v = min(1, max(0, y / h + 0.5))
            lit = 0.74 + 0.26 * math.sin(u * math.pi) * math.sin(v * math.pi)
            panel = 0.96 + 0.04 * math.cos(u * 5 * TAU)
            top = sstep((v - 0.42) / 0.16)
            base = tuple(a + (b - a) * top for a, b in zip((0.86, 0.72, 0.54), (1.0, 0.95, 0.86)))
            return tuple(c * lit * panel for c in base)
        f = B.obj(name + '_front', bm_surf(nu, nv, sheet), M_canvas, parent=P); B.vcol(f, canvas)
        b = B.obj(name + '_back', bm_surf(nu, nv, lambda u, v: sheet(u, v, -0.025), flip=True), M_canvas, parent=P); B.vcol(b, canvas_back)
        def back_z(x, y, off):
            v = y / h + 0.5; u = x / (w * (1 - (1 - v) * 0.1)) + 0.5
            return sheet(min(1, max(0, u)), min(1, max(0, v)), off)[2]
        def conform(bm, off):
            # lay a flat piece (built facing engine z, depth along z) onto the back of the billowing canvas
            for vt in bm.verts:
                x, y, zl = vt.co.x, vt.co.z, -vt.co.y
                vt.co.y = -(back_z(x, y, off) + zl)
            return bm
        # the panel seams, stitched down the back
        if not lo:
            for k in range(1, 5):
                uu = k / 5
                seam = [sheet(uu, i / 6, -0.03) for i in range(7)]
                B.obj(name + '_seam_%d' % k, bm_tube(seam, 0.008, 3), M_seam, parent=P)
        # our emblem on the back, high on the sail and off to one side (main sail right, fore sail left) so the pack sees
        # it past the captain's head: a gold doubloon, a dark compass star on it, a glowing pink heart at its heart
        EY, ER = (0.74 - 0.5) * h, h * 0.18
        EX = (0.25 if name == 'sailMain' else -0.25) * w * (1 - 0.26 * 0.1)
        B.obj(name + '_coin', conform(bm_profile([(EX + math.cos(a) * ER, EY + math.sin(a) * ER) for a in (TAU * i / B.pick(22, 12) for i in range(B.pick(22, 12)))], 0.01), -0.04), M_paintgold, parent=P)
        if not lo:
            ring = [(EX + math.cos(a) * (ER - 0.035), EY + math.sin(a) * (ER - 0.035), 0.0) for a in (TAU * i / 24 for i in range(24))]
            rb = bm_tube(ring, 0.014, 3, closed=True); B.obj(name + '_coin_rim', conform(rb, -0.052), M_star, parent=P)
        star = []
        for i in range(16):
            a = TAU * i / 16 + math.pi / 2; rr = (ER * 0.78 if i % 4 == 0 else ER * 0.42 if i % 2 == 0 else ER * 0.17)
            star.append((EX + math.cos(a) * rr, EY + math.sin(a) * rr))
        B.obj(name + '_star', conform(bm_profile(star, 0.01), -0.052), M_star, parent=P)
        kb = ER * 0.0075
        B.obj(name + '_heart_b', conform(bm_profile([(x + EX, y + EY - 9.5 * kb) for x, y in heart(kb, B.pick(16, 10))], 0.012), -0.064), M_pink, parent=P)
        B.obj(name + '_band_f', bm_surf(nu, 2, lambda u, v: sheet(u, v, 0.012, 0.42, 0.56)), M_red, parent=P)
        B.obj(name + '_band_b', bm_surf(nu, 2, lambda u, v: sheet(u, v, -0.037, 0.42, 0.56), flip=True), M_red, parent=P)
        for k, yy in enumerate((h / 2, -h / 2)):
            B.obj(name + '_yard_%d' % k, bm_rod((-w / 2 - 0.12, yy, -0.02), (w / 2 + 0.12, yy, -0.02), 0.045 if k == 0 else 0.038, B.pick(8, 5)), M_oak2, parent=P)
            for s in ((1, -1) if not lo else ()): B.obj(name + '_yard_cap_%d_%d' % (k, s > 0), bm_ico(0.05, 1, (s * (w / 2 + 0.13), yy, -0.02)), M_gold2, parent=P)
        if not lo:   # bolt ropes down the two side edges
            for s in (1, -1):
                edge = [sheet(0.0 if s < 0 else 1.0, i / 7, -0.012) for i in range(8)]
                B.obj(name + '_bolt_%d' % (s > 0), bm_tube(edge, 0.018, 4), M_rope, parent=P)
        hz = sheet(0.5, 0.5 + 0.12 / h)[2]
        k = 0.0875 * w * 0.3 / 2.8
        B.obj(name + '_heart', bm_profile(heart(k, B.pick(16, 12)), 0.04, (0, 0.1, hz + 0.008)), M_pink, parent=P, bevel=B.pick(0.012, None), bevel_angle=False, segments=1)
        return P
    for (pv, w, h), nm in ((SAIL_FORE, 'sailFore'), (SAIL_MAIN, 'sailMain')): sail(nm, pv, w, h)
    # ================= the pennant: a swallow-tailed flag streaming from the main mast top (the pose fn yaws it back) =================
    F = B.part('flag', (0, MAIN_TOP + 0.22, MAIN_Z))
    def pennant(u, v, off=0.0):
        tail = 0.18 * u * u * (1 - 2 * abs(v - 0.5)) if u > 0.6 else 0.0   # the swallow-tail notch
        return (0.035 * math.sin(u * TAU * 1.3) * u + off, (v - 0.5) * 0.42 * (1 - u * 0.45), u * 0.95 - tail)
    B.obj('flag_a', bm_surf(B.pick(14, 6), B.pick(4, 2), pennant), M_flag, parent=F)
    B.obj('flag_b', bm_surf(B.pick(14, 6), B.pick(4, 2), lambda u, v: pennant(u, v, -0.012), flip=True), M_flag, parent=F)
    B.obj('flag_edge', bm_rod((0, -0.22, 0.0), (0, 0.22, 0.0), 0.02, 5), M_gold2, parent=F)
    B.obj('flag_heart', bm_profile(heart(0.0875 * 0.26 / 2.8, B.pick(24, 12)), 0.06, (0, 0.0, 0.36), M=frame((0, 0, 1), (0, 1, 0), (-1, 0, 0))), M_pink, parent=F)

    # ================= wheels and the car's size info =================
    B.wheels_pro(1.05, 1.9, -1.9, r=0.48, w=0.4, rim=COL2, tyre='#141210', cap=LIGHT, stripe=COL2)
    top = SAIL_MAIN[0][1] + SAIL_MAIN[2] / 2
    B.info(6.4, 3.0, MAIN_TOP + 0.3, muzzle=(0, 1.55, 0), wheelR=0.48, extra={
        'cannons': [[1.6, 1.55, -0.7], [1.6, 1.55, 0.6], [-1.6, 1.55, -0.7], [-1.6, 1.55, 0.6]],
        'sight': [round(top + 0.05, 2), SAIL_MAIN[0][2]]})
    B.body['rigV'] = 2

LEVEL_OV = {'hi': dict(ico=1, bevel=3, cyl=24), 'lo': dict(ico=1)}
if __name__ == '__main__':
    run('dusty_doubloon', build, report=True, views=['side', 'high'], level_overrides=LEVEL_OV)
