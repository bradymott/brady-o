# Glitterfin (Art Cart car #2): a mirror-tiled fish that swims through the dust, riding a glossy low-rider hull.
# Run it inside an open Blender (Blender 5.2 crashes headless on Brady's Mac):
#   import runpy; runpy.run_path('/abs/path/tools/blender/glitterfin.py', run_name='__main__')
# Writes assets/models/art-cart/glitterfin.glb (showroom, <= 30k tris) and glitterfin_lo.glb (race, <= 7k).
#
# Rig (rigV 2, posed by CART_GLB_PARTS['fish:2'] in src/43_cart_bb_glb.js; the joints below are repeated there as
# CART_FISH_J, keep them in step):
#   part_fish          the mirror-tiled fish (eyes, lips, gills, dorsal fin, chin hanger), joint FJ: it swims (sway, roll, bob)
#   part_finL / finR   the pectoral fins, joints at their roots: they swish, following the fish
#   part_tail          the peduncle and forked tail fin, joint at the fish's rear: it swishes, following the fish
#   part_ball          the little mirror ball under the chin: it spins, following the fish
# The mirror tiles: the engine draws chrome as albedo x (ambient + sun) plus the sky reflection, so a bright tile is a
# flat white tile. Each tile instead gets its own vertex-colour value (dark tiles read as mirrors of the sky, bright ones
# flash) and sometimes a tint, a bevelled top (its slanted rim catches a different sky) and a random tilt; a few carry
# emissive star glints. The swim sway makes them shimmer as they turn.
import os, sys, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cartkit import *

COL, COL2, LIGHT = '#c8d4ec', '#ff6ad8', '#9ad8ff'   # CART_CARS.fish palette
BODY_AT, BRX, BRY, BRZ = (0, 1.95, 0.1), 1.22, 1.1, 2.35   # the fish's ellipsoid (car space)
EYES = [(0.8, 2.25, 1.55), (-0.8, 2.25, 1.55)]
LIPS = (0, 1.75, 2.38)
FJ = (0.0, 2.4, 0.1)            # part_fish joint
FIN_J = {'finL': (1.1, 1.75, 0.6), 'finR': (-1.1, 1.75, 0.6)}
TAIL_J = (0.0, 1.95, -2.2)
BALL_J = (0.0, 0.98, 2.3)
HULL_Y = 0.72

def spline(ctrl, per=4):
    """Closed Catmull-Rom curve through the control points (x, y) -> a smooth outline."""
    return catmull(ctrl, len(ctrl) * per, closed=True)

def shift(bm, J):
    """Move a piece built in car space into the local space of a part whose joint is J."""
    xf(bm, Matrix.Translation(-E(*J))); return bm

def hull_ring(z, w, h, r, seg, yc=HULL_Y, splits=(0.6,)):
    """A rounded-rectangle section of the hull at z with extra points at the heights in `splits` (absolute y), so the
    two-tone line lands on a real edge."""
    pts = rrect_pts(w, h, r, seg); out = []
    lo_y, hi_y = -h / 2 + r + 0.004, h / 2 - r - 0.004
    ys = sorted(min(hi_y, max(lo_y, s - yc)) for s in splits)
    for i, (x, y) in enumerate(pts):
        out.append((x, y)); nx, ny = pts[(i + 1) % len(pts)]
        if abs(x - w / 2) < 1e-6 and abs(nx - w / 2) < 1e-6 and ny > y: out += [(w / 2, s) for s in ys if y < s < ny]
        if abs(x + w / 2) < 1e-6 and abs(nx + w / 2) < 1e-6 and ny < y: out += [(-w / 2, s) for s in reversed(ys) if ny < s < y]
    return [(x, yc + y, z) for x, y in out]

def body_point(th, ph):
    """Car-space point on the fish ellipsoid: th around the vertical axis (0 = the left flank), ph from the top pole."""
    return Vector((BODY_AT[0] + BRX * math.sin(ph) * math.cos(th), BODY_AT[1] + BRY * math.cos(ph), BODY_AT[2] + BRZ * math.sin(ph) * math.sin(th)))
def body_normal(p):
    d = p - Vector(BODY_AT)
    return Vector((d.x / BRX ** 2, d.y / BRY ** 2, d.z / BRZ ** 2)).normalized()

def tile_colour(rng):
    """A mirror tile's vertex colour: mostly neutral values from dark (a mirror of the sky) to bright (a flash), some
    tinted cyan, pink or lavender like a disco ball catching coloured lights."""
    v = 0.14 + 0.86 * rng.random() ** 1.15
    k = rng.random()
    if k < 0.12: return (0.45 * v, 0.85 * v, 1.0 * v)
    if k < 0.22: return (1.0 * v, 0.45 * v, 0.85 * v)
    if k < 0.28: return (0.72 * v, 0.6 * v, 1.0 * v)
    return (v, v, min(1.0, v * 1.04))

def key(q): return (round(q[0], 4), round(q[1], 4), round(q[2], 4))

def mirror_tiles(pitch, th, rng, skip, bevel, cols, ph0=0.22, ph1=2.5):
    """Mirror tiles over the fish like a disco ball: rings walked by arc length so tiles stay square, a brick offset on
    alternate rings, a small random tilt each. bevel=True: a bevelled tile (a flat top inset on four slanted rims);
    else a flat quad. Fills cols {rounded car-space vertex: colour}; returns (bmesh, [(top centre, N, T)], count)."""
    bm = bmesh.new(); n_tiles = 0; tops = []
    rings = [ph0]; ph = ph0; acc = 0.0; dph = 0.002
    while ph < ph1:
        acc += 0.5 * (math.hypot(BRX * math.cos(ph), BRY * math.sin(ph)) + math.hypot(BRZ * math.cos(ph), BRY * math.sin(ph))) * dph; ph += dph
        if acc >= pitch: rings.append(ph); acc = 0.0
    sq = ((-1, -1), (1, -1), (1, 1), (-1, 1))
    for ri, ph in enumerate(rings):
        a, b = BRX * math.sin(ph), BRZ * math.sin(ph)
        S = 0.0; dth = 0.002; t = 0.0
        while t < TAU: S += math.hypot(a * math.sin(t), b * math.cos(t)) * dth; t += dth
        n = max(4, int(round(S / pitch))); step = S / n; su = step * 0.84
        avg = 0.5 * (math.hypot(BRX * math.cos(ph), BRY * math.sin(ph)) + math.hypot(BRZ * math.cos(ph), BRY * math.sin(ph)))
        target = step * (0.5 if ri % 2 else 0.0); t = 0.0; s = 0.0; placed = 0
        while placed < n and t < TAU:
            ds = math.hypot(a * math.sin(t), b * math.cos(t)) * dth
            if s + ds >= target:
                p = body_point(t, ph)
                if not skip(p):
                    N = body_normal(p)
                    sv = 0.84 * pitch * math.sqrt((BRX * math.cos(ph) * math.cos(t)) ** 2 + (BRY * math.sin(ph)) ** 2 + (BRZ * math.cos(ph) * math.sin(t)) ** 2) / avg
                    T = Vector((-BRX * math.sin(ph) * math.sin(t), 0, BRZ * math.sin(ph) * math.cos(t))).normalized()
                    N = (N + T * rng.uniform(-0.09, 0.09) + N.cross(T) * rng.uniform(-0.09, 0.09)).normalized()
                    T = (T - N * T.dot(N)).normalized(); Bt = N.cross(T)
                    base = p - N * 0.012; col = tile_colour(rng)
                    def V(u, v, w, k=1.0):
                        q = base + T * (u * su / 2 * k) + Bt * (v * sv / 2 * k) + N * w
                        cols[key(q)] = col
                        return bm.verts.new(E(q.x, q.y, q.z))
                    if bevel:
                        bo = [V(u, v, 0.0) for u, v in sq]
                        tp = [V(u, v, th, 0.72) for u, v in sq]
                        bm.faces.new(tp)
                        for k in range(4): bm.faces.new((bo[k], bo[(k + 1) % 4], tp[(k + 1) % 4], tp[k]))
                    else:
                        bm.faces.new([V(u, v, th) for u, v in sq])
                    tops.append((base + N * (th + 0.004), N, T)); n_tiles += 1
                target += step; placed += 1
            s += ds; t += dth
    bm.normal_update()
    c = E(*BODY_AT)   # every face faces away from the fish's centre
    outward(bm, lambda f: f.calc_center_median() - c)
    return bm, tops, n_tiles

def outward(bm, want):
    """Flip the faces whose normal points against want(face) (a direction)."""
    bm.normal_update()
    for i, f in enumerate(bm.faces): f.index = i
    flip = [f for f in bm.faces if f.normal.dot(want(f)) < 0]
    if flip: bmesh.ops.reverse_faces(bm, faces=flip)

def bm_star(at, N, T, r, rin, pts=4):
    """A flat emissive star glint (a fan) on the plane with normal N, one point along T."""
    bm = bmesh.new(); Bt = N.cross(T); c = bm.verts.new(E(*at)); ring = []
    for i in range(pts * 2):
        a = math.pi * i / pts; rr = r if i % 2 == 0 else rin
        q = Vector(at) + T * (math.cos(a) * rr) + Bt * (math.sin(a) * rr)
        ring.append(bm.verts.new(E(q.x, q.y, q.z)))
    for i in range(len(ring)): bm.faces.new((c, ring[i], ring[(i + 1) % len(ring)]))
    n = E(*N) - E(0, 0, 0)
    outward(bm, lambda f: n)
    return bm

def tile_lathe(P, rows, seg, centre_fn, rng, cols):
    """Separate flat mirror facets (each its own colour, small gaps) over a surface P(th, v) for v in 0..1:
    the chin ball and the tail's peduncle. centre_fn(v) -> the axis point the facets must face away from."""
    bm = bmesh.new(); dirs = []
    for i in range(rows):
        v0, v1 = (i + 0.07) / rows, (i + 0.93) / rows
        for j in range(seg):
            t0, t1 = TAU * (j + 0.07) / seg, TAU * (j + 0.93) / seg
            col = tile_colour(rng); vs = []
            for th, v in ((t0, v0), (t1, v0), (t1, v1), (t0, v1)):
                q = P(th, v); cols[key(q)] = col; vs.append(bm.verts.new(E(*q)))
            bm.faces.new(vs); dirs.append(E(*centre_fn((v0 + v1) / 2)))
    outward(bm, lambda f: f.calc_center_median() - dirs[f.index])
    return bm

def paint_lookup(B, ob, cols, J=(0, 0, 0), default=(1, 1, 1)):
    """Vertex colours from a {rounded car-space point: colour} map (the piece lives in a part's space with joint J)."""
    B.vcol(ob, lambda x, y, z: cols.get(key((x + J[0], y + J[1], z + J[2])), default))

def build(B):
    L = B.L; lo = B.lo; rng = random.Random(7)
    B.export_try = VCOL_EXPORT
    # ---- materials ----
    M_paint = paint('fish_hull', '#1b2560', coat=1.0, rough=0.2, metal=0.35)      # midnight sapphire clear coat
    M_sill = paint('fish_sill', '#0e1020', coat=1.0, rough=0.22, metal=0.2)
    M_deck = matte('fish_deck', '#0c0d18', 0.9)
    M_tile = metal('mirror_tile', '#f2f5ff', 0.05)
    M_grout = satin('grout', '#1a1d2c', 0.6)
    M_fin = glow('fin_pink', COL2, strength=0.8, rough=0.18, coat=1.0)
    M_lip = paint('lip_pink', '#ff4fb0', rough=0.16, metal=0.1)
    M_lid = paint('lid_pink', COL2, rough=0.2, metal=0.15)
    led_c, led_p, led_w, ledwarm = led(LIGHT), led(COL2), led('#ffffff'), led('#fff0d8')

    # ---- the hull: a glossy sapphire low-rider (lofted rounded sections), black sill, chrome trim, wheel arches ----
    cs = B.pick(6, 2)
    rings = [hull_ring(2.5, 1.6, 0.34, 0.15, cs, yc=0.74), hull_ring(2.42, 1.96, 0.52, 0.2, cs), hull_ring(2.26, 2.18, 0.62, 0.22, cs)]
    if not lo: rings += [hull_ring(0.0, 2.2, 0.64, 0.22, cs)]
    rings += [hull_ring(-2.26, 2.18, 0.62, 0.22, cs), hull_ring(-2.42, 1.96, 0.52, 0.2, cs), hull_ring(-2.5, 1.6, 0.34, 0.15, cs, yc=0.74)]
    shell = B.obj('hull', bm_loft(rings, closed_u=True, caps=True), [M_paint, M_sill], face_mat=lambda f: 1 if f.calc_center_median().z < 0.6 else 0)
    B.vcol(shell, lambda x, y, z: (0.75 + 0.35 * sstep((1.0 - z / 2.5) / 2), 0.85 + 0.15 * sstep((1.0 - z / 2.5) / 2), 1.0))   # sapphire nose to violet tail
    for i, (x, z) in enumerate([(1.0, 1.6), (-1.0, 1.6), (1.0, -1.6), (-1.0, -1.6)]):
        B.cut([shell], bm_cyl(0.6, 0.6, 0.9, L['arch'], AX, (math.copysign(1.2, x), 0.46, z)), 'arch_%d' % i)
        B.obj('flare_%d' % i, bm_torus(0.615, 0.032, L['torus'], B.pick(4, 3), AX, (math.copysign(1.105, x), 0.46, z), sweep=(math.pi / 2, 3 * math.pi / 2)), chrome())
    for s in (1, -1):
        B.obj('shoulder_%d' % (s > 0), bm_tube(catmull([(s * 0.86, 1.0, 2.44), (s * 1.08, 1.03, 1.9), (s * 1.1, 1.03, -1.9), (s * 0.86, 1.0, -2.44)], B.pick(12, 4)), 0.02, B.pick(8, 4)), chrome())
        B.strip((s * 1.09, 0.42, 2.1), (s * 1.09, 0.42, -2.1), LIGHT, th=0.04)
        B.light(s * 0.95, 0.25, 0.0, 2.4, LIGHT, led=1)
        if not lo:   # a pink glowing wave pinstripe along each flank between the arches, with cyan bubbles above it
            wave = [(s * 1.106, 0.78 + 0.06 * math.sin(k / 10 * TAU * 1.5), 0.9 - 1.8 * k / 10) for k in range(11)]
            B.obj('wave_%d' % (s > 0), bm_tube(catmull(wave, 18), 0.014, 5), led_p)
            for k, z in enumerate((0.75, 0.25, -0.25, -0.75)):
                B.obj('bubble_%d_%d' % (s > 0, k), bm_ico(0.035 + 0.012 * (k % 2), 1, (s * 1.115, 0.92 + 0.03 * (k % 2), z)), led_c)
    B.strip((-0.8, 0.42, 2.48), (0.8, 0.42, 2.48), LIGHT, th=0.035); B.strip((-0.8, 0.42, -2.48), (0.8, 0.42, -2.48), LIGHT, th=0.035)
    B.obj('deck', bm_box(1.86, 0.03, 4.3, (0, 1.035, 0)), M_deck, bevel=0.012, bevel_angle=False, segments=1)
    for s in (1, -1): B.strip((s * 0.94, 1.055, 2.0), (s * 0.94, 1.055, -2.0), COL2, th=0.022)   # pink piping on the deck edge
    # the chrome cradle collar where the fish sits in the deck
    nc = B.pick(30, 16)
    B.obj('collar', bm_tube([(0.72 * math.cos(TAU * k / nc), 1.07, 0.1 + 1.36 * math.sin(TAU * k / nc)) for k in range(nc)], 0.045, B.pick(6, 5), closed=True), chrome())
    B.obj('collar_glow', bm_tube([(0.8 * math.cos(TAU * k / nc), 1.055, 0.1 + 1.44 * math.sin(TAU * k / nc)) for k in range(nc)], 0.018, 4, closed=True), led_c)

    # ---- face of the hull: bezelled headlights, a cyan LED smile, chrome tube bumpers; round tail lights ----
    for s in (1, -1):
        hx = s * 0.66
        B.obj('head_cup_%d' % (s > 0), bm_closed_lathe([(0, -0.06), (0.13, -0.05), (0.14, 0.0), (0.0, 0.01)], L['cyl_s'], AZ, (hx, 0.78, 2.5)), dark_chrome())
        B.obj('head_bezel_%d' % (s > 0), bm_torus(0.135, 0.024, L['torus'], B.pick(4, 3), AZ, (hx, 0.78, 2.515)), chrome())
        B.obj('head_lens_%d' % (s > 0), bm_ellipsoid(0.115, 0.03, 0.115, L['cyl_s'], B.pick(5, 2), (hx, 0.78, 2.51), phi1=math.pi / 2, M=AZ), ledwarm)
        B.light(hx, 0.78, 2.6, 1.3, '#fff2c8', head=1)
        B.obj('tail_ring_%d' % (s > 0), bm_torus(0.1, 0.02, L['torus'], B.pick(4, 3), AZn, (s * 0.62, 0.8, -2.525)), chrome())
        B.obj('tail_%d' % (s > 0), bm_ellipsoid(0.085, 0.03, 0.085, L['cyl_s'], B.pick(4, 2), (s * 0.62, 0.8, -2.52), phi1=math.pi / 2, M=AZn), led('#ff2a6a'))
        B.light(s * 0.62, 0.8, -2.65, 0.9, '#ff2a3a', tail=1)
    B.strip((-0.42, 0.8, -2.54), (0.42, 0.8, -2.54), '#ff2a6a', th=0.03)   # a red light bar between the tail lamps
    B.leds((-0.3, 0.8, 2.54), (0.3, 0.8, 2.54), B.pick(5, 3), [LIGHT, '#ffffff'], 0.03, 0, prefix='smile')
    for zs, zc in ((1, 2.66), (-1, -2.66)):
        path = catmull([(1.06, 0.55, zc - zs * 0.42), (0.96, 0.55, zc - zs * 0.1), (0.6, 0.55, zc), (-0.6, 0.55, zc), (-0.96, 0.55, zc - zs * 0.1), (-1.06, 0.55, zc - zs * 0.42)], B.pick(16, 7))
        B.obj('bumper_%d' % (zs > 0), bm_tube(path, 0.06, B.pick(8, 6)), chrome())

    # ---- the fish (part_fish): grout shell under mirror tiles, glints, eyes with lashes, lips, gills, dorsal fin ----
    FISH = B.part('fish', FJ)
    F = lambda name, bm, m, **kw: B.obj(name, shift(bm, FJ), m, parent=FISH, **kw)
    def dip(x, y, z):
        """0..1 falloff of the dished seat on the fish's back, so the cushion sits IN the body."""
        d = math.hypot(x / 0.5, (z + 0.05) / 0.55)
        return 0.0 if d >= 1 or y < 2.5 else (1 - d * d) ** 2
    def skip(p):
        if p.y < 1.1: return True
        for e in EYES:
            if (p - Vector(e)).length < 0.42: return True
        if (p - Vector(LIPS)).length < 0.44: return True
        if abs(p.x) < 0.16 and -1.8 < p.z < -0.4 and p.y > 2.4: return True     # under the dorsal fin
        if dip(p.x, p.y, p.z) > 0.03: return True
        return False
    core = bm_ellipsoid(BRX - 0.01, BRY - 0.01, BRZ - 0.01, *B.pick((24, 12), (20, 11)), BODY_AT)
    for v in core.verts:
        x, y, z = v.co.x, v.co.z, -v.co.y; k = dip(x, y, z)
        if k > 0: v.co.z = y - k * (y - 2.88)
    F('fish_core', core, M_grout)
    cols = {}
    tiles, tops, n = mirror_tiles(B.pick(0.235, 0.3), B.pick(0.03, 0.012), rng, skip, not lo, cols)
    paint_lookup(B, F('tiles', tiles, M_tile, flat=True), cols, FJ)
    print('glitterfin %s: %d mirror tiles' % (B.level, n))
    # star glints on a few tiles (they bloom in the showroom and at night)
    grng = random.Random(11); picks = grng.sample(range(len(tops)), min(len(tops), B.pick(34, 12)))
    stars = None
    for k, i in enumerate(picks):
        c, N, T = tops[i]; r = B.pick(0.1, 0.12) * (0.7 + 0.6 * grng.random())
        T2 = (T * math.cos(0.4 * k) + N.cross(T) * math.sin(0.4 * k)).normalized()
        sb = bm_star(tuple(c), N, T2, r, r * 0.22)
        stars = merge(stars, sb) if stars else sb
    F('glints', stars, led_w, smooth=False)
    if not lo: F('seat_trim', bm_torus(0.5, 0.025, L['torus'], 6, AY, (0, 2.96, -0.05), sy=1.1), chrome())
    # gill arcs: a chrome one and a pink glowing one behind it
    for s in (1, -1):
        sw = (-0.8, 0.8) if s > 0 else (math.pi - 0.8, math.pi + 0.8)
        F('gill_%d' % (s > 0), bm_torus(1.12, 0.034, B.pick(18, 8), B.pick(6, 4), AZ, (0, 1.95, 1.3), sweep=sw, sy=0.9), chrome())
        F('gill_glow_%d' % (s > 0), bm_torus(1.17, 0.022, B.pick(18, 8), B.pick(5, 3), AZ, (0, 1.95, 1.12), sweep=sw, sy=0.9), led_p)
    # lateral line: cyan bulbs along each flank
    nb = B.pick(9, 5)
    for s in (1, -1):
        for i in range(nb):
            z = 0.75 - 2.4 * i / (nb - 1); y = 2.05 - 0.08 * i / (nb - 1)
            dz_, dy_ = (z - BODY_AT[2]) / BRZ, (y - BODY_AT[1]) / BRY
            x = s * BRX * math.sqrt(max(0.0, 1 - dz_ * dz_ - dy_ * dy_))
            p = Vector((x, y, z)); p = p + body_normal(p) * 0.055
            F('lat_%d_%d' % (s > 0, i), bm_ico(0.045, 1, (p.x, p.y, p.z)), led_c)
            if i in (1, nb - 2): B.light(p.x, p.y, p.z, 0.45, LIGHT, led=1)
    # puffy pink lips with a candy gradient, a dark mouth, a tongue
    lips = F('lips', bm_torus(0.3, 0.145, B.pick(22, 10), B.pick(8, 5), AZ @ RX(-12), LIPS, sy=0.72), M_lip)
    B.vcol(lips, lambda x, y, z: (1.0, 0.72 + 0.28 * sstep((y + FJ[1] - 1.62) / 0.3), 0.88 + 0.12 * sstep((y + FJ[1] - 1.62) / 0.3)))
    F('mouth', bm_cyl(0.19, 0.19, 0.1, L['cyl_s'], AZ, (0, 1.75, 2.33)), matte('mouth', '#2a0a20'))
    if not lo: F('tongue', bm_ellipsoid(0.11, 0.04, 0.09, 12, 5, (0, 1.68, 2.38)), paint('tongue', '#ff6a8a', rough=0.3))
    # big eyes: white, iris, pupil, highlight, a chrome socket ring, a pink lid with a chrome rim and three curled lashes
    for i, e in enumerate(EYES):
        s = 1 if e[0] > 0 else -1
        F('eye_%d_white' % i, bm_uv(0.3, B.pick(18, 12), B.pick(11, 8), e), paint('eye_white', '#ffffff', coat=0.3, rough=0.2, metal=0))
        F('eye_%d_iris' % i, bm_uv(0.135, max(8, L['sph'] // 2), max(5, L['ring'] // 2), (e[0] + s * 0.06, e[1] + 0.015, e[2] + 0.215)), mat('iris_3a1a5a', '#3a1a5a', rough=0.1, metal=0.4))
        F('eye_%d_pupil' % i, bm_uv(0.07, B.pick(12, 6), B.pick(6, 4), (e[0] + s * 0.075, e[1] + 0.015, e[2] + 0.29)), mat('pupil', '#06040c', rough=0.1))
        if not lo: F('eye_%d_hl' % i, bm_uv(0.035, 8, 5, (e[0] + s * 0.02 + 0.05, e[1] + 0.09, e[2] + 0.31)), led('#ffffff', 3.0))
        F('eye_%d_ring' % i, bm_torus(0.31, 0.026, B.pick(20, 10), B.pick(4, 3), aim((s * 0.5, 0.05, 1)), (e[0] + s * 0.03, e[1], e[2] + 0.03)), chrome())
        F('lid_%d' % i, bm_ellipsoid(0.335, 0.335, 0.335, B.pick(20, 10), B.pick(6, 3), e, M=rot(pitch=0.3), phi1=0.95), M_lid)
        rim_c = (e[0], e[1] + 0.335 * math.cos(0.95) * math.cos(0.3), e[2] + 0.335 * math.cos(0.95) * math.sin(0.3))
        F('lid_rim_%d' % i, bm_torus(0.335 * math.sin(0.95), 0.018, B.pick(20, 10), B.pick(4, 3), rot(pitch=0.3), rim_c), chrome())
        if not lo:
            for k, a in enumerate((-0.55, 0.0, 0.55)):
                bx, bz = math.sin(a) * 0.26, math.cos(a) * 0.26
                p0 = (e[0] + bx, rim_c[1] + 0.03, e[2] + bz * 0.85 + 0.04)
                lash = catmull([p0, (p0[0] + bx * 0.3, p0[1] + 0.1, p0[2] + 0.09), (p0[0] + bx * 0.55, p0[1] + 0.15, p0[2] + 0.2)], 6)
                F('lash_%d_%d' % (i, k), bm_tube(lash, [0.02, 0.018, 0.016, 0.012, 0.009, 0.0], 6), mat('lash', '#1a1020', rough=0.3))
    # dorsal fin (on the fish): a puffy pink fin in the YZ plane, chrome rays, LED tips
    dz = lambda z, y: (-z, y)     # outline x = -engine z (rot(yaw=90°) maps it back)
    dorsal_ctrl = [dz(-0.45, 2.75), dz(-0.52, 3.2), dz(-0.7, 3.52), dz(-0.92, 3.66), dz(-1.15, 3.52), dz(-1.42, 3.25), dz(-1.72, 2.9), dz(-1.85, 2.55), dz(-1.2, 2.5)]
    dpts = spline(dorsal_ctrl, B.pick(5, 2))
    dc = (sum(p[0] for p in dpts) / len(dpts), sum(p[1] for p in dpts) / len(dpts))
    dors = F('dorsal', bm_puffy(dpts, lambda p: 0.035, 0.075, B.pick(6, 3), centre=dc, M=rot(yaw=math.pi / 2)), M_fin)
    B.vcol(dors, lambda x, y, z: (1.0, 0.8 + 0.2 * sstep((y + FJ[1] - 3.0) / 0.6), 1.0))
    edge = [p for p in dpts if p[0] > 0.55 and p[1] > 2.75][::B.pick(3, 4)]
    if not lo:
        for i, q in enumerate(edge):
            for side in (1, -1):
                F('dorsal_ray_%d_%d' % (i, side > 0), bm_rod((side * 0.05, 2.62, -0.95), (side * 0.03, q[1] - 0.04, -q[0] * 0.98), 0.014, 4, 0.007), chrome())
    for i, q in enumerate(edge[1:-1:2]): F('dorsal_tip_%d' % i, bm_ico(0.035, 1, (0, q[1], -q[0])), led_c)
    # the chin hanger (the ball itself spins on part_ball)
    F('hanger', bm_rod((0, 1.4, 1.95), (0, 1.2, 2.28), 0.02, L['rod']), chrome())
    F('ball_cap', bm_uv(0.045, 8, 5, (0, 1.2, 2.28)), chrome())

    # ---- pectoral fins (part_finL / finR): puffy fins flat in XZ, chrome rays, a pink root bulb ----
    for s, name in ((1, 'finL'), (-1, 'finR')):
        J = FIN_J[name]; P = B.part(name, J)
        ctrl = [(0.0, 0.12), (0.35, 0.2), (0.62, 0.14), (0.82, -0.04), (0.8, -0.26), (0.62, -0.44), (0.38, -0.54), (0.14, -0.5), (0.0, -0.3)]
        pts = [(s * x, z) for x, z in spline(ctrl, B.pick(5, 2))]
        if s < 0: pts = pts[::-1]
        f = B.obj(name + '_fin', bm_puffy(pts, lambda p: 0.03, 0.065, B.pick(6, 3), centre=(s * 0.36, -0.16), M=rot(pitch=math.pi / 2)), M_fin, parent=P)
        B.vcol(f, lambda x, y, z: (1.0, 0.75 + 0.25 * sstep(abs(x) / 0.8), 1.0))
        if not lo:
            for i, q in enumerate([p for p in pts if abs(p[0]) > 0.45][::3]):
                for side in (1, -1):
                    B.obj('%s_ray_%d_%d' % (name, i, side > 0), bm_rod((s * 0.08, side * 0.05, -0.15), (q[0] * 0.97, side * 0.03, q[1] * 0.97), 0.014, 4, 0.007), chrome(), parent=P)
        B.obj(name + '_root', bm_uv(0.13, B.pick(14, 8), B.pick(8, 5), (s * 0.05, 0, -0.12)), M_lid, parent=P)

    # ---- tail (part_tail): a mirror-faceted peduncle, a glowing ring and a forked puffy tail fin ----
    T = B.part('tail', TAIL_J)
    pc = {}
    ped = tile_lathe(lambda th, v: (math.cos(th) * (0.4 - 0.2 * v), math.sin(th) * (0.4 - 0.2 * v) * 0.95, 0.06 - 0.72 * v), B.pick(4, 2), B.pick(16, 10), lambda v: (0, 0, 0.06 - 0.72 * v), random.Random(5), pc)
    paint_lookup(B, B.obj('tail_peduncle', ped, M_tile, parent=T, flat=True), pc)
    B.obj('tail_core', bm_cyl(0.19, 0.38, 0.74, B.pick(16, 8), AZ, (0, 0, -0.3)), M_grout, parent=T)
    B.obj('tail_ring', bm_torus(0.22, 0.03, B.pick(18, 10), 4, AZ, (0, 0, -0.68)), led_c, parent=T)
    tail_ctrl = [dz(-0.6, 0.22), dz(-0.95, 0.5), dz(-1.3, 0.85), dz(-1.52, 1.05), dz(-1.42, 0.62), dz(-1.2, 0.2), dz(-1.12, 0.0), dz(-1.2, -0.2), dz(-1.42, -0.62), dz(-1.52, -1.05), dz(-1.3, -0.85), dz(-0.95, -0.5), dz(-0.6, -0.22)]
    tpts = spline(tail_ctrl, B.pick(4, 2))
    tf = B.obj('tail_fin', bm_puffy(tpts, lambda p: 0.035, 0.08, B.pick(6, 3), centre=(0.85, 0.0), M=rot(yaw=math.pi / 2)), M_fin, parent=T)
    B.vcol(tf, lambda x, y, z: (1.0, 0.72 + 0.28 * sstep((-z - 0.8) / 0.7), 1.0))
    tedge = [p for p in tpts if p[0] > 1.1][::3]
    if not lo:
        for i, q in enumerate(tedge):
            for side in (1, -1):
                B.obj('tail_ray_%d_%d' % (i, side > 0), bm_rod((side * 0.05, 0.0, -0.72), (side * 0.03, q[1] * 0.97, -q[0] * 0.98), 0.014, 4, 0.007), chrome(), parent=T)
    for i, q in enumerate(tedge[::2]): B.obj('tail_tip_%d' % i, bm_ico(0.035, 1, (0, q[1], -q[0])), led_c, parent=T)

    # ---- the mirror ball under the chin (part_ball, it spins): coloured facets over a dark core ----
    BALL = B.part('ball', BALL_J)
    bc = {}
    B.obj('ball_core', bm_uv(0.2, B.pick(16, 8), B.pick(10, 6)), M_grout, parent=BALL)
    rows = B.pick(10, 6)
    bb = tile_lathe(lambda th, v: (math.sin(math.pi * v) * math.cos(th) * 0.22, math.cos(math.pi * v) * 0.22, math.sin(math.pi * v) * math.sin(th) * 0.22), rows, B.pick(18, 10), lambda v: (0, 0, 0), random.Random(3), bc)
    paint_lookup(B, B.obj('ball', bb, M_tile, parent=BALL, flat=True), bc)
    B.light(0, 1.0, 2.3, 2.2, '#bfe8ff', big=1)

    # ---- seat on the fish's back, the steering stalk, wheels, size info ----
    B.seat(0, 3.08, 0.05, col='#ff4fb0', accent=LIGHT, wheelY=3.42, wheelZ=0.7)
    B.obj('stalk', bm_rod((0, 2.6, 0.75), (0, 3.0, 0.92), 0.04, L['rod']), chrome())
    B.wheels_pro(1.0, 1.6, -1.6, r=0.46, w=0.38, rim='#7ab8ff', cap=LIGHT, stripe=COL2)
    B.info(5.24, 2.4, 3.4, muzzle=(0, 1.0, 2.5), wheelR=0.46)
    B.body['rigV'] = 2

if __name__ == '__main__':
    run('glitterfin', build, report=True, views=['side', 'high'], level_overrides={'hi': dict(ico=1), 'lo': dict(ico=1)})
