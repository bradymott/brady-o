# Pyramid Scheme (Art Cart car #6): an Egyptian-revival laser pyramid on a black sound truck. Join now!
# Headless:  /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/pyramid_scheme.py
# Writes assets/models/art-cart/pyramid_scheme.glb (showroom, 20–30k tris) and pyramid_scheme_lo.glb (race, 5–8k).
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cartkit import *

COL, COL2, LIGHT = '#2a2236', '#ffc83a', '#3aff8a'   # CART_CARS.pyramid palette: dark violet, gold, laser green
PZ = 0.5                                              # the pyramid's centre line (engine z)
TIERS = [(2.4, 3.3, 1.32), (1.9, 2.6, 1.82), (1.4, 1.9, 2.3), (0.9, 1.2, 2.76)]   # (w, d, y) of the four tiers, 0.5 tall
TURRET = (0, 3.08, 0.5)                               # part_turret pivot (the pose fn spins it about Y)

def bm_frame(w, d, bw, th, at):
    """A flat rectangular frame (outer w × d, bar width bw, thickness th) lying in the XZ plane, centred at `at`:
    the gold coping that crowns each tier. One closed shell, so a bevel modifier chamfers it cleanly."""
    bm = bmesh.new()
    def ring(hx, hz, y):
        return [bm.verts.new(E(at[0] + sx * hx, at[1] + y, at[2] + sz * hz)) for sx, sz in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
    ob, ib = ring(w / 2, d / 2, -th / 2), ring(w / 2 - bw, d / 2 - bw, -th / 2)
    ot, it = ring(w / 2, d / 2, th / 2), ring(w / 2 - bw, d / 2 - bw, th / 2)
    for i in range(4):
        j = (i + 1) % 4
        bm.faces.new((ot[i], ot[j], it[j], it[i]))
        bm.faces.new((ob[i], ib[i], ib[j], ob[j]))
        bm.faces.new((ob[i], ob[j], ot[j], ot[i]))
        bm.faces.new((ib[i], it[i], it[j], ib[j]))
    bm.normal_update(); bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm

def pyramidion(B, name, at, r, h, m):
    """A small four-sided gold pyramid (faces square to the car), tip up, base centred at `at`."""
    B.obj(name, bm_cyl(r, 0.0, h, 4, RZ(45), (at[0], at[1] + h / 2, at[2])), m, smooth=False)

def build(B):
    L = B.L; lo = B.lo
    # ---- materials: black-violet clear coat, two violets for the tiers, gold, chrome, laser green ----
    M_paint = paint('paint_black', '#1a1622', rough=0.26, metal=0.25)
    M_tier = [paint('tier_a', '#221c2c', rough=0.3, metal=0.2), paint('tier_b', COL, rough=0.3, metal=0.2)]
    M_gold = metal('gold', COL2, 0.18); M_gold2 = metal('gold_dark', '#c89a2a', 0.26)
    M_chan = matte('channel', '#0c0a10', 0.7); M_tower = satin('tower', '#141218', 0.5)
    M_emit = glow('emitter', '#7affb0', strength=5.0, rough=0.2)
    ledg = led(LIGHT)
    def stud(name, p, m=None, r=0.03):
        if lo: return
        B.obj(name, bm_ico(r, 0, p), m or chrome())

    # ---- the truck: bevelled black body, dark skirt, wheel-arch pockets with chrome fenders ----
    shell = B.obj('shell', bm_box(2.5, 0.8, 5.0, (0, 0.92, 0)), M_paint, bevel=0.2)
    skirt = B.obj('skirt', bm_box(2.2, 0.26, 4.6, (0, 0.48, 0)), matte('skirt', '#0a080c'), bevel=0.07)
    for i, (x, z) in enumerate([(1.12, 1.75), (-1.12, 1.75), (1.12, -1.75), (-1.12, -1.75)]):
        B.cut([shell, skirt], bm_cyl(0.64, 0.64, 1.0, L['arch'], AX, (x * 1.1, 0.5, z)), 'arch_%d' % i)
        B.obj('fender_%d' % i, bm_torus(0.66, 0.05, L['torus'], L['tube'], AX, (x, 0.5, z), sweep=(math.pi / 2, 3 * math.pi / 2)), chrome())
    # laser-green skirt lines all round, a gold rub rail above the arches
    for s in (1, -1):
        B.strip((s * 1.115, 0.6, 2.05), (s * 1.115, 0.6, -2.25), LIGHT)
        B.obj('rail_%d' % (s > 0), bm_rod((s * 1.26, 1.2, 2.25), (s * 1.26, 1.2, -2.25), 0.022, L['rod']), M_gold)
    B.strip((-1.0, 0.6, 2.22), (1.0, 0.6, 2.22), LIGHT); B.strip((-1.0, 0.6, -2.42), (1.0, 0.6, -2.42), LIGHT)
    # chrome bumpers with guards
    for z in (2.5, -2.5): B.obj('bumper_%d' % (z > 0), bm_box(2.3, 0.14, 0.16, (0, 0.62, z)), chrome(), bevel=0.05, bevel_angle=False)
    for s in (1, -1):
        B.obj('guard_%d' % (s > 0), bm_box(0.12, 0.3, 0.2, (s * 0.75, 0.66, 2.54)), chrome(), bevel=0.04, bevel_angle=False)
    # grille, winged sun disc, square gold lamp bezels, the lamps
    B.obj('grille', bm_box(1.3, 0.34, 0.1, (0, 0.8, 2.5)), dark_chrome(), bevel=0.03, bevel_angle=False)
    for k in range(3):
        y = 0.68 + k * 0.12
        B.obj('grille_bar_%d' % k, bm_rod((-0.6, y, 2.56), (0.6, y, 2.56), 0.018, L['rod']), chrome())
    B.obj('sun_ring', bm_torus(0.12, 0.028, L['torus'], L['tube'], AZ, (0, 1.06, 2.53)), M_gold)
    B.obj('sun_disc', bm_cyl(0.1, 0.1, 0.03, L['cyl_s'], AZ, (0, 1.06, 2.53)), ledg)
    for s in (1, -1):
        B.obj('wing_a_%d' % (s > 0), bm_rod((s * 0.13, 1.08, 2.54), (s * 0.64, 1.17, 2.54), 0.022, L['rod'], 0.012), M_gold)
        B.obj('wing_b_%d' % (s > 0), bm_rod((s * 0.13, 1.0, 2.54), (s * 0.6, 1.03, 2.54), 0.02, L['rod'], 0.01), M_gold)
        B.obj('bezel_%d' % (s > 0), bm_box(0.46, 0.46, 0.08, (s * 0.95, 1.05, 2.46)), M_gold2, bevel=0.03, bevel_angle=False)
        B.obj('tail_bezel_%d' % (s > 0), bm_box(0.42, 0.2, 0.06, (s * 0.95, 1.0, -2.47)), M_gold2, bevel=0.02, bevel_angle=False)
    B.lamps(0.95, 1.05, 2.48, -2.48, 1.0)
    # gold pylon posts at the truck corners: a collar, a pyramidion and a green bulb on each
    for sx in (1, -1):
        for sz in (1, -1):
            x, z = sx * 1.2, sz * 2.38; top = 1.72 if sz > 0 else 2.3
            nm = 'pylon_%d_%d' % (sx > 0, sz > 0)
            B.obj(nm, bm_rod((x, 0.7, z), (x, top, z), 0.06, L['rod']), M_gold)
            if not lo: B.obj(nm + '_collar', bm_torus(0.065, 0.018, B.pick(12, 8), 5, AY, (x, top - 0.14, z)), M_gold2)
            if not lo: B.obj(nm + '_sq', bm_box(0.17, 0.05, 0.17, (x, top + 0.02, z)), M_gold2, bevel=0.012, segments=1)
            pyramidion(B, nm + '_cap', (x, top + 0.04, z), 0.11, 0.26, M_gold)
            B.obj(nm + '_tip', bm_ico(0.04, L['ico'], (x, top + 0.32, z)), ledg)

    # ---- the stepped pyramid: four tiers with chamfered gold copings, laser-line edges, LED channels, studs ----
    for i, (w, d, y) in enumerate(TIERS):
        hw, hd = w / 2, d / 2
        B.obj('tier_%d' % i, bm_box(w, 0.5, d, (0, y, PZ)), M_tier[i % 2], bevel=0.05)
        B.obj('coping_%d' % i, bm_frame(w + 0.1, d + 0.1, 0.12, 0.07, (0, y + 0.245, PZ)), M_gold, bevel=None if lo else 0.025, bevel_angle=False, segments=1)
        # the laser line: a green strip ring under the coping, bulbs at the corners, strips down the corner edges
        yy = y + 0.2; ox, oz = hw + 0.035, hd + 0.035
        cs = [(ox, yy, PZ + oz), (-ox, yy, PZ + oz), (-ox, yy, PZ - oz), (ox, yy, PZ - oz)]
        for k in range(4): B.strip(cs[k], cs[(k + 1) % 4], LIGHT, name='edge_%d_%d' % (i, k))
        ybot = max(y - 0.2, 1.36)
        for k, c in enumerate(cs):
            B.obj('corner_%d_%d' % (i, k), bm_ico(0.05, L['ico'], c), ledg)
            if not lo: B.strip((c[0], ybot, c[2]), (c[0], yy, c[2]), LIGHT, name='vedge_%d_%d' % (i, k))
        # the LED channel: a recessed dark groove with green bulbs along both flanks and the back (tier 1 lights the game)
        yb = 1.43 if i == 0 else y
        n = B.pick(6, 3)
        for s in (1, -1):
            if not lo: B.obj('chan_%d_%d' % (i, s > 0), bm_box(0.03, 0.1, d - 0.2, (s * (hw + 0.005), yb, PZ)), M_chan)
            B.leds((s * (hw + 0.02), yb, PZ + hd - 0.15), (s * (hw + 0.02), yb, PZ - hd + 0.15), n, LIGHT, 0.05, 2 if i == 1 else 0, prefix='tled%d_%d' % (i, s > 0))
        if not lo:
            B.obj('chan_b_%d' % i, bm_box(w - 0.2, 0.1, 0.03, (0, yb, PZ - hd - 0.005)), M_chan)
            B.leds((-hw + 0.15, yb, PZ - hd - 0.02), (hw - 0.15, yb, PZ - hd - 0.02), 5, LIGHT, 0.05, 0, prefix='bled%d' % i)
        # hieroglyph-like stud rows: chrome studs along the lower band of every face (gold every other on the front)
        if not lo and i > 0:
            ys = y - 0.16
            nz = max(2, int(round((d - 0.3) / 0.28)))
            for k in range(nz + 1):
                z = PZ - hd + 0.15 + (d - 0.3) * k / nz
                for s in (1, -1): stud('stud_%d_%d_%d' % (i, s > 0, k), (s * (hw + 0.015), ys, z))
            nx = max(2, int(round((w - 0.3) / 0.28)))
            for k in range(nx + 1):
                x = -hw + 0.15 + (w - 0.3) * k / nx
                stud('stud_b_%d_%d' % (i, k), (x, ys, PZ - hd - 0.015))
                if i != 1: stud('stud_f_%d_%d' % (i, k), (x, ys, PZ + hd + 0.015), M_gold if k % 2 else None)
    # tier 1's front band: a chrome/gold stud frieze across the face
    hw0, hd0 = TIERS[0][0] / 2, TIERS[0][1] / 2
    for k in range(11):
        x = -1.0 + 0.2 * k
        stud('frieze_%d' % k, (x, 1.45, PZ + hd0 + 0.015), M_gold if k % 2 else None, 0.035)
    # the chrome eye motif on the second tier's front face: almond outline, dark iris, green pupil, gold brow and tear
    ez = PZ + TIERS[1][1] / 2 + 0.02; ey = 1.82
    B.obj('eye_outline', bm_torus(0.26, 0.022, L['torus'], L['tube'], AZ, (0, ey, ez), sy=0.5), chrome())
    B.obj('eye_iris', bm_cyl(0.1, 0.1, 0.04, L['cyl_s'], AZ, (0, ey, ez)), dark_chrome())
    B.obj('eye_pupil', bm_cyl(0.045, 0.045, 0.05, L['cyl_s'], AZ, (0, ey, ez + 0.01)), ledg)
    B.obj('eye_brow', bm_torus(0.3, 0.02, L['torus'], L['tube'], AZ, (0, ey - 0.04, ez), sweep=(0.2 * math.pi, 0.8 * math.pi), sy=0.7), M_gold)
    if not lo:
        B.obj('eye_tear', bm_rod((0.14, ey - 0.12, ez), (0.22, ey - 0.23, ez), 0.015, L['rod']), M_gold)
        B.obj('eye_curl', bm_rod((-0.26, ey, ez), (-0.44, ey - 0.06, ez), 0.015, L['rod']), M_gold)

    # ---- speaker towers at the back corners, cones facing the crowd behind, chrome guards, gold caps ----
    for s in (1, -1):
        tx = s * 0.95; nm = 'tower_%d' % (s > 0)
        B.obj(nm, bm_box(0.58, 1.0, 0.6, (tx, 1.75, -2.0)), M_tower, bevel=0.05)
        B.obj(nm + '_cap', bm_box(0.64, 0.06, 0.66, (tx, 2.27, -2.0)), M_gold, bevel=0.02, segments=1)
        if not lo:
            for sx in (1, -1):
                for sz in (1, -1):
                    B.obj(nm + '_guard_%d_%d' % (sx > 0, sz > 0), bm_rod((tx + sx * 0.29, 1.3, -2.0 + sz * 0.3), (tx + sx * 0.29, 2.23, -2.0 + sz * 0.3), 0.022, L['rod']), chrome())
        for yy in (1.5, 2.0):
            B.speaker((tx, yy, -2.31), AZn, 0.2, 0.23, 'spk_%d_%d' % (s > 0, int(yy * 10)), LIGHT)
        for sx in (1, -1): B.strip((tx + sx * 0.3, 1.32, -2.32), (tx + sx * 0.3, 2.2, -2.32), LIGHT, name=nm + '_edge_%d' % (sx > 0))
        pyramidion(B, nm + '_tip', (tx, 2.3, -2.0), 0.13, 0.3, M_gold)
        B.obj(nm + '_bulb', bm_ico(0.045, L['ico'], (tx, 2.62, -2.0)), ledg)

    # ---- the laser turret on the apex (part_turret, spins about Y): gold base, dark dome, four chrome arms, emitter ----
    T = B.part('turret', TURRET)
    B.obj('t_base', bm_cyl(0.42, 0.42, 0.2, L['cyl'], AY, (0, 0, 0)), M_gold, parent=T, bevel=0.04)
    B.obj('t_ring', bm_torus(0.42, 0.022, L['torus'], L['tube'], AY, (0, 0.1, 0)), chrome(), parent=T)
    B.obj('t_glow', bm_torus(0.36, 0.015, L['torus'], max(3, L['tube'] - 4), AY, (0, 0.105, 0)), ledg, parent=T)
    B.obj('t_dome', bm_ellipsoid(0.34, 0.34, 0.34, B.pick(24, 12), B.pick(10, 5), (0, 0.1, 0), phi1=math.pi / 2), M_paint, parent=T)
    B.obj('t_band', bm_torus(0.34, 0.025, L['torus'], L['tube'], AY, (0, 0.12, 0)), M_gold, parent=T)
    if not lo:
        ph = 0.95
        B.obj('t_band2', bm_torus(0.34 * math.sin(ph), 0.02, L['torus'], 5, AY, (0, 0.1 + 0.34 * math.cos(ph), 0)), M_gold2, parent=T)
        for k in range(8):
            a = k / 8 * TAU
            stud('t_stud_%d' % k, (math.sin(a) * 0.4, -0.02, math.cos(a) * 0.4), M_gold2, 0.025)
    for k in range(4):
        a = k / 4 * TAU; sx, sz = math.sin(a), math.cos(a)
        B.obj('t_arm_%d' % k, bm_rod((sx * 0.22, 0.3, sz * 0.22), (sx * 0.5, 0.52, sz * 0.5), 0.045, L['rod'], 0.03), chrome(), parent=T)
        if not lo: B.obj('t_cup_%d' % k, bm_cyl(0.04, 0.07, 0.06, L['cyl_s'], AY, (sx * 0.5, 0.5, sz * 0.5)), dark_chrome(), parent=T)
        B.obj('t_tip_%d' % k, bm_ico(0.06, L['ico'], (sx * 0.5, 0.55, sz * 0.5)), ledg, parent=T)
    if not lo: B.obj('t_halo', bm_torus(0.5, 0.018, L['torus'], L['tube'], AY, (0, 0.5, 0)), chrome(), parent=T)
    B.obj('t_stalk', bm_cyl(0.1, 0.08, 0.12, L['cyl_s'], AY, (0, 0.45, 0)), chrome(), parent=T)
    B.obj('t_collar', bm_torus(0.1, 0.02, L['cyl_s'], 5, AY, (0, 0.48, 0)), M_gold, parent=T)
    B.obj('t_emitter', bm_uv(0.16, B.pick(20, 10), B.pick(12, 6), (0, 0.62, 0)), M_emit, parent=T)
    B.light(0, 3.7, 0.5, 3.2, LIGHT, big=1)

    # ---- wheels, seat between the towers, size info ----
    B.wheels(1.12, 1.75, -1.75, r=0.5, w=0.42, rim=COL2, tyre='#141218', cap=LIGHT)
    B.seat(0, 1.62, -1.75, col=COL, accent=LIGHT, wheelZ=-1.18)
    B.info(5.2, 2.6, 3.9, muzzle=(0, 3.6, 0.5), wheelR=0.5)

if __name__ == '__main__':
    run('pyramid_scheme', build, level_overrides={'hi': dict(ico=1, bevel=3, cyl=24, torus=20, tube=6), 'lo': dict(torus=10, tube=4)})
