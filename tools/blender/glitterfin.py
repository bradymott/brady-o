# Glitterfin (Art Cart car #2): a mirror-tiled fish that swims through the dust. The rider sits on its back.
# Headless:  /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/glitterfin.py
# Writes assets/models/art-cart/glitterfin.glb (showroom, 20–30k tris) and glitterfin_lo.glb (race, 5–8k).
import os, sys, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cartkit import *

COL, COL2, LIGHT = '#c8d4ec', '#ff6ad8', '#9ad8ff'   # CART_CARS.fish palette
BODY_AT, BRX, BRY, BRZ = (0, 1.95, 0.1), 1.22, 1.1, 2.35   # the procedural ellipsoid
EYES = [(0.8, 2.25, 1.55), (-0.8, 2.25, 1.55)]
LIPS = (0, 1.75, 2.38)

def spline(ctrl, per=4):
    """Closed Catmull-Rom curve through the control points (x, y) -> a smooth outline for bm_profile."""
    n = len(ctrl); out = []
    for i in range(n):
        p0, p1, p2, p3 = ctrl[(i - 1) % n], ctrl[i], ctrl[(i + 1) % n], ctrl[(i + 2) % n]
        for k in range(per):
            t = k / per; t2 = t * t; t3 = t2 * t
            out.append(tuple(0.5 * (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3) for c in (0, 1)))
    return out

def body_point(th, ph):
    """Engine point on the body ellipsoid: th around the vertical axis (0 = the left flank), ph from the top pole."""
    return Vector((BODY_AT[0] + BRX * math.sin(ph) * math.cos(th), BODY_AT[1] + BRY * math.cos(ph), BODY_AT[2] + BRZ * math.sin(ph) * math.sin(th)))
def body_normal(p):
    d = p - Vector(BODY_AT)
    return Vector((d.x / BRX ** 2, d.y / BRY ** 2, d.z / BRZ ** 2)).normalized()

def mirror_tiles(pitch, th, rng, skip, ph0=0.22, ph1=2.5):
    """A few hundred flat chrome squares laid over the body like a disco ball: rings of tiles walked by arc length so
    they stay roughly square, a brick offset on alternate rings, and a tiny random tilt on each so they sparkle."""
    bms = [bmesh.new() for _ in range(3)]; n_tiles = 0
    # meridian walk: average arc length of the x-side and z-side meridians
    rings = []; ph = ph0; acc = 0.0; dph = 0.002
    rings.append(ph0)
    while ph < ph1:
        ds = 0.5 * (math.hypot(BRX * math.cos(ph), BRY * math.sin(ph)) + math.hypot(BRZ * math.cos(ph), BRY * math.sin(ph))) * dph
        acc += ds; ph += dph
        if acc >= pitch: rings.append(ph); acc = 0.0
    for ri, ph in enumerate(rings):
        a, b = BRX * math.sin(ph), BRZ * math.sin(ph)
        # perimeter of this ring's ellipse and the tile count that keeps the pitch
        S = 0.0; dth = 0.002; t = 0.0
        while t < TAU: S += math.hypot(a * math.sin(t), b * math.cos(t)) * dth; t += dth
        n = max(4, int(round(S / pitch))); step = S / n
        su = step * 0.8
        avg = 0.5 * (math.hypot(BRX * math.cos(ph), BRY * math.sin(ph)) + math.hypot(BRZ * math.cos(ph), BRY * math.sin(ph)))
        # walk the ring by arc length, placing a tile every `step` (half a step offset on alternate rings)
        target = step * (0.5 if ri % 2 else 0.0); t = 0.0; s = 0.0; placed = 0
        while placed < n and t < TAU:
            ds = math.hypot(a * math.sin(t), b * math.cos(t)) * dth
            if s + ds >= target:
                p = body_point(t, ph)
                if not skip(p):
                    N = body_normal(p)
                    sv = 0.8 * pitch * math.sqrt((BRX * math.cos(ph) * math.cos(t)) ** 2 + (BRY * math.sin(ph)) ** 2 + (BRZ * math.cos(ph) * math.sin(t)) ** 2) / avg
                    T = Vector((-BRX * math.sin(ph) * math.sin(t), 0, BRZ * math.sin(ph) * math.cos(t))).normalized()
                    # a little random tilt so neighbouring mirrors catch different sky
                    N = (N + T * rng.uniform(-0.06, 0.06) + N.cross(T) * rng.uniform(-0.06, 0.06)).normalized()
                    T = (T - N * T.dot(N)).normalized(); Bt = N.cross(T)
                    base = p - N * 0.012
                    bm = bms[rng.randrange(3)]; vs = []
                    for w in (0.0, th):
                        for (u, v) in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
                            q = base + T * (u * su / 2) + Bt * (v * sv / 2) + N * w
                            vs.append(bm.verts.new(E(q.x, q.y, q.z)))
                    bo, tp = vs[:4], vs[4:]
                    bm.faces.new(tp); bm.faces.new(bo[::-1])
                    for k in range(4):
                        bm.faces.new((bo[k], bo[(k + 1) % 4], tp[(k + 1) % 4], tp[k]))
                    n_tiles += 1
                target += step; placed += 1
            s += ds; t += dth
    for bm in bms: bm.normal_update(); bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bms, n_tiles

def facet(bm):
    """Split every edge so the piece stays faceted (each face its own mirror) through the kit's smooth-by-angle pass."""
    bmesh.ops.split_edges(bm, edges=bm.edges[:])
    return bm

def fin_rays(B, name, root, edge_pts, to3, parent, offset, every=1):
    """Chrome rays from a root point to points along a fin edge (both faces), like the bones of a fish fin."""
    pts = edge_pts[::every]
    for i, e in enumerate(pts):
        for side in (1, -1):
            p0 = to3(root, side * offset); p1 = to3(e, side * offset)
            B.obj('%s_ray_%d_%d' % (name, i, side > 0), bm_rod(p0, p1, 0.016, B.L['rod'], 0.008), chrome(), parent=parent)

def build(B):
    L = B.L; lo = B.lo; rng = random.Random(7)
    M_tile = metal('tile_chrome', '#dfe6f6', 0.05)
    M_tiles = [M_tile, metal('tile_chrome_b', '#f0f3ff', 0.04), metal('tile_chrome_c', '#c8d2ea', 0.06)]
    M_grout = satin('grout', '#2e3344', 0.6)
    M_fin = glow('fin_pink', COL2, strength=1.0, rough=0.25)
    M_lip = paint('lip_pink', '#ff4fb0', rough=0.2, metal=0.1)
    M_lid = paint('lid_pink', COL2, rough=0.22, metal=0.15)
    led_c, led_p, led_w = led(LIGHT), led(COL2), led('#ffffff')

    # ---- chassis: dark platform with cyan/pink LED rows, chrome bumpers, a chrome pedestal under the belly ----
    B.platform(4.3, 2.1, 0.62, 0.42, '#1a1c28', leds=[LIGHT, COL2])
    for z in (2.2, -2.2): B.obj('bumper_%d' % (z > 0), bm_box(1.9, 0.12, 0.14, (0, 0.5, z)), chrome(), bevel=0.04, bevel_angle=False)
    B.obj('pedestal', bm_cyl(0.5, 0.5, 0.35, L['cyl'], AY, (0, 0.8, 0)), chrome(), bevel=0.06)
    B.lamps(0.75, 0.62, 2.15, -2.15, 0.62)

    # ---- the body: at hi a dark grout shell under ~500 mirror tiles; at lo one faceted chrome shell ----
    def skip(p):
        if p.y < 1.0: return True                                              # inside the platform
        for e in EYES:
            if (p - Vector(e)).length < 0.4: return True
        if (p - Vector(LIPS)).length < 0.42: return True
        if abs(p.x) < 0.16 and -1.8 < p.z < -0.4 and p.y > 2.4: return True     # under the dorsal fin
        if dip(p.x, p.y, p.z) > 0.03: return True                               # the seat dip
        return False
    def dip(x, y, z):
        """0..1 falloff of the dished seat on the fish's back (the seat's footprint), so the cushion sits IN the body."""
        d = math.hypot(x / 0.5, (z + 0.05) / 0.55)
        return 0.0 if d >= 1 or y < 2.5 else (1 - d * d) ** 2
    shell = bm_ellipsoid(BRX, BRY, BRZ, *B.pick((32, 18), (22, 13)), BODY_AT)
    for v in shell.verts:
        x, y, z = v.co.x, v.co.z, -v.co.y; k = dip(x, y, z)
        if k > 0: v.co.z = y - k * (y - 2.88)
    if lo:
        B.obj('shell', facet(shell), M_tile, smooth=False)
    else:
        B.obj('shell', shell, M_grout)
        bms, n = mirror_tiles(0.235, 0.035, rng, skip)
        for i, bm in enumerate(bms): B.obj('tiles_%d' % i, bm, M_tiles[i], smooth=False)
        print('glitterfin: %d mirror tiles' % n)
        B.obj('seat_trim', bm_torus(0.5, 0.025, L['torus'], 6, AY, (0, 2.96, -0.05), sy=1.1), chrome())
    # gill arcs on both flanks: a chrome one and a pink glowing one behind it
    for s in (1, -1):
        sw = (-0.8, 0.8) if s > 0 else (math.pi - 0.8, math.pi + 0.8)
        B.obj('gill_%d' % (s > 0), bm_torus(1.1, 0.035, B.pick(16, 8), B.pick(6, 5), AZ, (0, 1.95, 1.3), sweep=sw, sy=0.9), chrome())
        B.obj('gill_glow_%d' % (s > 0), bm_torus(1.15, 0.022, B.pick(16, 8), B.pick(5, 3), AZ, (0, 1.95, 1.12), sweep=sw, sy=0.9), led_p)
    # lateral line: cyan bulbs along each flank, a few with game lights
    n = B.pick(9, 5)
    for s in (1, -1):
        for i in range(n):
            z = 0.75 - 2.4 * i / (n - 1); y = 2.05 - 0.08 * i / (n - 1)
            dz, dy = (z - BODY_AT[2]) / BRZ, (y - BODY_AT[1]) / BRY
            x = s * BRX * math.sqrt(max(0.0, 1 - dz * dz - dy * dy))
            p = Vector((x, y, z)); p = p + body_normal(p) * 0.05
            B.obj('lat_%d_%d' % (s > 0, i), bm_uv(0.045, B.pick(8, 6), B.pick(5, 4), (p.x, p.y, p.z)), led_c)
            if i in (1, n - 2): B.light(p.x, p.y, p.z, 0.45, LIGHT, led=1)

    # ---- the face: puffy pink lips, a dark mouth, big eyes with pink lids ----
    B.obj('lips', bm_torus(0.3, 0.14, B.pick(20, 10), B.pick(8, 5), AZ @ RX(-12), LIPS, sy=0.7), M_lip)
    B.obj('mouth', bm_cyl(0.19, 0.19, 0.1, L['cyl_s'], AZ, (0, 1.75, 2.33)), matte('mouth', '#2a0a20'))
    for i, e in enumerate(EYES):
        s = 1 if e[0] > 0 else -1
        B.eye(e, 0.3, iris='#3a1a5a', look=(s * 0.4, 0), name='eye_%d' % i)
        B.obj('lid_%d' % i, bm_ellipsoid(0.335, 0.335, 0.335, B.pick(18, 10), B.pick(6, 3), e, M=rot(pitch=0.3), phi1=0.95), M_lid)
        B.obj('lid_rim_%d' % i, bm_torus(0.335 * math.sin(0.95), 0.018, B.pick(18, 10), B.pick(4, 3), rot(pitch=0.3), (e[0], e[1] + 0.335 * math.cos(0.95) * math.cos(0.3), e[2] + 0.335 * math.cos(0.95) * math.sin(0.3))), chrome())

    # ---- dorsal fin (static, behind the seat): a puffy pink profile in the YZ plane with chrome rays and LED tips ----
    dz = lambda z, y: (-z, y)     # profile x = -engine z (rot(yaw=90°))
    dorsal_ctrl = [dz(-0.45, 2.75), dz(-0.5, 3.3), dz(-0.68, 3.7), dz(-0.9, 3.88), dz(-1.15, 3.7), dz(-1.42, 3.35), dz(-1.72, 2.95), dz(-1.85, 2.55), dz(-1.2, 2.5)]
    dpts = spline(dorsal_ctrl, B.pick(5, 2))
    d = B.obj('dorsal', bm_profile(dpts, 0.12, M=rot(yaw=math.pi / 2)), M_fin)
    B.bevel(d, 0.045, angle=True, segments=min(L['prof_bev'], 4), profile=0.62)
    if not lo:
        edge = [p for p in dpts if p[0] > 0.55 and p[1] > 2.75][::4]
        fin_rays(B, 'dorsal', (0.75, 2.6), edge, lambda q, o: (o, q[1], -q[0]), None, 0.05)
    edge = [p for p in dpts if p[0] > 0.55 and p[1] > 2.75][::4]
    for i, q in enumerate(edge[1:-1:2]): B.obj('dorsal_tip_%d' % i, bm_uv(0.035, B.pick(8, 6), B.pick(5, 3), (0, q[1], -q[0])), led_c)

    # ---- pectoral fins (parts finL/finR): spread outward from the pivot, flat in XZ; the pose fn rolls them ----
    for s, name in ((1, 'finL'), (-1, 'finR')):
        P = B.part(name, (s * 1.1, 1.75, 0.6))
        ctrl = [(0.0, 0.12), (0.35, 0.2), (0.62, 0.14), (0.8, -0.04), (0.76, -0.24), (0.6, -0.42), (0.38, -0.52), (0.14, -0.5), (0.0, -0.3)]
        pts = [(s * x, z) for x, z in spline(ctrl, B.pick(4, 2))]
        f = B.obj(name + '_fin', bm_profile(pts, 0.09, M=rot(pitch=math.pi / 2)), M_fin, parent=P)
        B.bevel(f, 0.04, angle=True, segments=min(L['prof_bev'], 4), profile=0.62)
        if not lo:
            edge = [p for p in pts if abs(p[0]) > 0.45][::4]
            fin_rays(B, name, (s * 0.08, -0.15), edge, lambda q, o: (q[0], o, q[1]), P, 0.04)
        B.obj(name + '_root', bm_uv(0.12, B.pick(12, 8), B.pick(8, 5), (s * 0.05, 0, -0.12)), M_lid, parent=P)

    # ---- tail (part): a faceted chrome peduncle, a glowing ring and a forked pink tail fin; the pose fn yaws it ----
    T = B.part('tail', (0, 1.95, -2.2))
    B.obj('tail_peduncle', facet(bm_cyl(0.2, 0.38, 0.7, B.pick(16, 10), AZ, (0, 0, -0.33))), M_tile, parent=T, smooth=False)
    B.obj('tail_ring', bm_torus(0.22, 0.03, L['torus'], L['tube'], AZ, (0, 0, -0.7)), led_c, parent=T)
    tail_ctrl = [dz(-0.6, 0.22), dz(-0.95, 0.5), dz(-1.3, 0.85), dz(-1.5, 1.05), dz(-1.42, 0.62), dz(-1.2, 0.2), dz(-1.12, 0.0), dz(-1.2, -0.2), dz(-1.42, -0.62), dz(-1.5, -1.05), dz(-1.3, -0.85), dz(-0.95, -0.5), dz(-0.6, -0.22)]
    tpts = spline(tail_ctrl, B.pick(4, 2))
    t = B.obj('tail_fin', bm_profile(tpts, 0.1, M=rot(yaw=math.pi / 2)), M_fin, parent=T)
    B.bevel(t, 0.04, angle=True, segments=min(L['prof_bev'], 4), profile=0.62)
    if not lo:
        edge = [p for p in tpts if p[0] > 1.1][::4]
        fin_rays(B, 'tail', (0.72, 0.0), edge, lambda q, o: (o, q[1], -q[0]), T, 0.045)
        for i, q in enumerate(edge[::2]): B.obj('tail_tip_%d' % i, bm_uv(0.035, 8, 5, (0, q[1], -q[0])), led_c, parent=T)

    # ---- the mirror ball under the chin: a faceted chrome ball on a chrome wire; the game's big light glows there ----
    B.obj('hanger', bm_rod((0, 1.4, 1.95), (0, 1.15, 2.22), 0.02, L['rod']), chrome())
    B.obj('ball_cap', bm_uv(0.045, 8, 5, (0, 1.17, 2.26)), chrome())
    B.obj('ball', facet(bm_uv(0.22, B.pick(18, 10), B.pick(12, 7), (0, 0.98, 2.3))), M_tile, smooth=False)
    B.light(0, 1.0, 2.3, 2.2, '#bfe8ff', big=1)

    # ---- seat on the fish's back, the steering stalk, wheels, size info ----
    B.seat(0, 3.08, 0.05, col='#ff4fb0', accent=LIGHT, wheelY=3.42, wheelZ=0.7)
    B.obj('stalk', bm_rod((0, 2.6, 0.75), (0, 3.0, 0.92), 0.04, L['rod']), chrome())
    B.wheels(1.0, 1.6, -1.6, r=0.44, w=0.36, rim=COL, cap=LIGHT)
    B.info(5.0, 2.6, 3.4, muzzle=(0, 1.0, 2.5), wheelR=0.44)

if __name__ == '__main__':
    run('glitterfin', build, level_overrides={'hi': dict(ico=1), 'lo': dict(ico=1)})
