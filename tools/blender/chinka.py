# Chinka: Brady's wife as a rigged, animated glTF character for the Burns engine (BurnsSkin, docs/BURNS_GUIDE.md §6.9),
# built on tools/blender/charkit.py. An original "Incan goddess" design: warm tan skin, long dark wavy hair past the
# shoulders (lofted hair sheets plus swept strands on hair bones), strong brows, big eyes with lashes, full lips and a
# warm smile; a voluptuous hourglass figure (full bust, narrow waist, wide hips, a round behind, long legs) in a fitted
# ivory-and-pale-gold robe with a flowing ankle-length skirt and a back cape, stepped (Andean) gold trim on the hems and
# belt that glows softly, a gold collar (her LED necklace), sun-disc earrings, a thin gold circlet, a gold armband, gold
# sandals, bare arms, and about sixty tiny emissive beads over the robe and hair. 1.68 m. PG-13: the robe stays on.
# Mixamo bone names (25) plus 16 secondary bones (hair x6, skirt x8, cape x2) = 41 joints; 19 clips from charkit.CLIPS.
#
# Headless:  /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/chinka.py
# Writes assets/models/shared/chinka.glb and assets/blender/chinka.blend. CHAR_PREVIEWS=<dir> renders EEVEE previews.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from charkit import *

K = 1.65 / 1.8          # everything below is authored at the mannequin's 1.8 m and scaled down
SK = Matrix.Scale(K, 4)

def sc(p): return (p[0] * K, p[1] * K, p[2] * K)

def build_chinka(rig):
    skin = mat('skin_tan', '#c9956c', rough=0.86); freckle = mat('freckle', '#7e5238', rough=0.8); ivory = mat('robe_ivory', '#eee7d9', rough=0.9)
    gold_cloth = mat('robe_gold', '#e9d3a0', rough=0.85); gold = mat('gold_trim', '#d3a345', rough=0.3, metal=0.6, emit='#ffcf5c', strength=0.12)
    gold_hi = mat('gold_bright', '#e9bc65', rough=0.25, metal=0.6, emit='#ffd870', strength=0.55)
    bead = mat('bead', '#fff2cc', rough=0.3, emit='#fff2cc', strength=2.0)
    hair = mat('hair_dark', '#2e1a10', rough=0.5); brow = mat('brow_dark', '#17100c', rough=0.8)
    white = mat('eye_white', '#fbfbf7', rough=0.3); iris = mat('iris', '#3a2214', rough=0.2); pupil = mat('pupil', '#0a0806', rough=0.3)
    hl = mat('eye_hl', '#e4d9c6', rough=0.25); lash = mat('lash', '#251812', rough=0.7)
    lip = mat('lip_rose', '#aa6762', rough=0.65, coat=0.15); teeth = mat('teeth', '#f4f1ea', rough=0.4)
    L, Rr = 'Left', 'Right'
    def part(name, bm, mats, bones, soft=1.0, wfn=None):
        bm_xf(bm, SK); rig.part(name, bm, mats, bones, soft, wfn)
    SPINE = ['Spine1', 'Spine2', 'Spine', 'Hips', L + 'Shoulder', Rr + 'Shoulder']
    SKIRT = ['SkirtF1', 'SkirtF2', 'SkirtB1', 'SkirtB2', 'SkirtL1', 'SkirtL2', 'SkirtR1', 'SkirtR2', 'Hips', L + 'UpLeg', Rr + 'UpLeg']
    HAIRB = ['HairB1', 'HairB2', 'Head', 'Neck']
    # ---- the figure: a fitted bodice lathed over an hourglass profile, the bust and the behind under the robe ----
    prof = [(0.0, 0.90), (0.21, 0.90), (0.225, 0.95), (0.205, 1.01), (0.165, 1.075), (0.15, 1.11), (0.165, 1.16), (0.2, 1.23), (0.205, 1.29), (0.185, 1.35), (0.165, 1.41), (0.13, 1.455), (0.075, 1.48), (0.0, 1.49)]
    bodice_rows = []
    for radius, y in prof:
        if radius == 0:
            bodice_rows.append([(0, y, 0)])
            continue
        ring = []
        for j in range(28):
            th = TAU*j/28
            # Shape the robe itself rather than layering spheres over the chest.
            front = max(0, math.sin(th)) ** 3
            fullness = .022 * math.exp(-((y-1.28)/.075)**2) * front
            ring.append((radius*math.cos(th),y,.66*radius*math.sin(th)+fullness))
        bodice_rows.append(ring)
    part('bodice', bm_loft(bodice_rows, closed_u=True, caps=True), ivory, SPINE, 1.3)
    # ---- the skirt: a double-sided loft from the hips to the ankles, drape stripes in ivory and pale gold ----
    levels = [(0.95, 0.215, 0.145, 0.0), (0.84, 0.238, 0.175, 0.0), (0.66, 0.25, 0.205, 0.0), (0.48, 0.268, 0.232, 0.0), (0.32, 0.29, 0.26, 0.0), (0.19, 0.315, 0.285, 0.0), (0.085, 0.345, 0.315, 0.02)]
    N = 40
    rings = [[((rx + 0.006 * math.cos(10 * TAU * j / N)) * math.cos(TAU * j / N), y + w * math.sin(5 * TAU * j / N), (rz + 0.006 * math.cos(10 * TAU * j / N)) * math.sin(TAU * j / N)) for j in range(N)] for y, rx, rz, w in levels]
    skirt = bm_loft(rings, closed_u=True, closed_v=False, caps=False); shell(skirt, 0.012)
    for f in skirt.faces:
        c = f.calc_center_median(); th = math.atan2(-c.y, c.x)
        f.material_index = 1 if int((th / TAU * 12 + 0.5) % 12) % 2 == 0 else 0
    part('skirt', skirt, [ivory, gold_cloth], SKIRT, 2.4)
    # the hem: a glowing gold tube along the wavy edge and a stepped meander of little gold blocks above it
    hem = [(rx * math.cos(TAU * j / N), y + w * math.sin(5 * TAU * j / N), rz * math.sin(TAU * j / N)) for j in range(N) for y, rx, rz, w in [levels[-1]]]
    hem = [(x * 1.02, y, z * 1.02) for x, y, z in hem]
    part('hem', bm_tube(hem, 0.012, 6, closed=True), gold, ['SkirtF2', 'SkirtB2', 'SkirtL2', 'SkirtR2'], 2.0)
    def skirt_r(y):
        ys = [l[0] for l in levels][::-1]
        return hermite(ys, [l[1] for l in levels][::-1], y), hermite(ys, [l[2] for l in levels][::-1], y)
    y = levels[-1][0]
    for i in range(24):
        th = TAU * i / 24; step = (i % 4)
        h = y + 0.045 + (0.0, 0.028, 0.056, 0.028)[step]
        rx, rz = skirt_r(h); px, pz = (rx + 0.008) * math.cos(th), (rz + 0.008) * math.sin(th)
        part('hemstep%d' % i, bm_box(0.028, 0.022, 0.012, (px, h, pz), M=rot(math.atan2(math.cos(th), math.sin(th)))), gold, ['SkirtF2', 'SkirtB2', 'SkirtL2', 'SkirtR2'], 2.0)
    # ---- the cape: a drape panel hanging from the shoulders down the back, weighted to the cape bones ----
    rows = []
    for i in range(8):
        v = i / 7; y = 1.43 - v * 0.93; wdt = 0.22 + 0.26 * v; zc = -0.1 - 0.18 * v
        rows.append([(-wdt / 2 + wdt * j / 5, y + (0.015 * math.sin(j * 2.1) if i == 7 else 0.0), zc - 0.02 * (1 - (abs(j - 2.5) / 2.5) ** 2)) for j in range(6)])
    cape = bm_loft(rows, closed_u=False, closed_v=False, caps=False); shell(cape, 0.012)
    part('cape', cape, gold_cloth, ['Cape1', 'Cape2', 'Spine2', L + 'Shoulder', Rr + 'Shoulder'], 2.2)
    part('cape_hem', bm_tube(rows[-1], 0.009, 5), gold, ['Cape2'], 2.0)
    # ---- belt and collar: gold, with the stepped pattern ----
    part('belt', bm_torus(0.158, 0.014, 20, 5, AY, (0, 1.09, 0), sy=0.66), gold, ['Spine', 'Spine1', 'Hips'], 1.2)
    for i in range(12):
        th = TAU * i / 12; h = 1.09 + (0.02 if i % 2 else 0.038)
        part('beltstep%d' % i, bm_box(0.022, 0.018, 0.01, (0.162 * math.cos(th), h, 0.107 * math.sin(th)), M=rot(math.atan2(math.cos(th), math.sin(th)))), gold, ['Spine', 'Spine1'], 1.2)
    part('collar', bm_torus(0.09, 0.013, 14, 5, AY, (0, 1.465, 0.0), sy=0.8), gold_hi, ['Spine2', 'Neck'], 1.0)
    part('collar_disc', bm_cyl(0.024, 0.024, 0.008, 12, AZ, (0, 1.42, 0.12)), gold_hi, ['Spine2', 'Neck'], 1.0)
    # ---- neck and head ----
    part('neck', capsule((0, 1.45, -0.005), (0, 1.58, -0.005), 0.047, None, 14, 3, 2), skin, ['Neck', 'Spine2', 'Head'])
    # Continuous cheek, jaw and forehead surface, rather than intersecting face spheres.
    face_rows = [(1.565, .015, .035, .010), (1.580, .042, .063, .004),
                 (1.610, .068, .084, -.004), (1.640, .082, .098, -.008),
                 (1.666, .090, .101, -.010), (1.690, .091, .100, -.012),
                 (1.714, .087, .100, -.014), (1.745, .077, .086, -.018),
                 (1.774, .046, .055, -.022), (1.790, .001, .001, -.022)]
    rings = []
    for y, rx, rz, cz in face_rows:
        ring = []
        for j in range(40):
            th = TAU * j / 40; front = max(0, math.cos(th)) ** 6
            z = cz + rz * math.cos(th) - front * .006 * math.exp(-((y-1.692)/.016)**2)
            ring.append((rx * math.sin(th), y, z))
        rings.append(ring)
    part('sculpted_head', bm_loft(rings, closed_u=True, caps=True), skin, ['Head'], 0.6)
    for i, (x, y, z) in enumerate(((0.052, 1.66, 0.084), (-0.048, 1.652, 0.087), (0.07, 1.64, 0.07), (-0.03, 1.628, 0.095), (0.036, 1.672, 0.09))):
        part('freckle%d' % i, ellipsoid((x, y, z), 0.0035, 0.003, 0.002, 6, 3), freckle, ['Head'], 0.6)
    for s in (1, -1):
        part('ear%d' % s, ellipsoid((s * 0.088, 1.668, -0.015), 0.012, 0.026, 0.018, 10, 6), skin, ['Head'], 0.6)
        # sun-disc earrings: a gold disc with a brighter centre, hanging under the ear
        hx, hy, hz, hr = s * 0.1, 1.628, -0.012, 0.016
        twist = lambda u: [(0.0068 * (1 + 0.4 * math.cos(3 * a - u * TAU * 3)) * math.cos(a), 0.0068 * (1 + 0.4 * math.cos(3 * a - u * TAU * 3)) * math.sin(a)) for a in (TAU * j / 7 for j in range(7))]
        part('hoop%d' % s, bm_sweep(lambda u: (hx, hy + hr * math.cos(u * TAU), hz + hr * math.sin(u * TAU)), twist, 12, closed=True, ref=(1, 0, 0)), gold, ['Head'], 0.6)
    # eyes: big, with iris, pupil, highlight, an upper lash line and lash flicks
    for s in (1, -1):
        part('eye%d' % s, ellipsoid((s * 0.037, 1.692, 0.079), 0.025, 0.012, 0.016, 12, 7), white, ['Head'], 0.6)
        part('iris%d' % s, ellipsoid((s * 0.035, 1.692, 0.09), 0.013, 0.013, 0.007, 10, 5), iris, ['Head'], 0.6)
        part('pupil%d' % s, ellipsoid((s * 0.035, 1.692, 0.095), 0.0065, 0.0065, 0.004, 8, 4), pupil, ['Head'], 0.6)
        part('hl%d' % s, ellipsoid((s * 0.03, 1.697, 0.098), 0.004, 0.004, 0.003, 6, 3), hl, ['Head'], 0.6)
        part('lash%d' % s, bm_torus(0.028, 0.005, 12, 4, AZ, (s * 0.037, 1.692, 0.094), sweep=(math.pi * 0.05, math.pi * 0.95), sy=0.7), lash, ['Head'], 0.6)
        part('wing%d' % s, bm_rod((s * 0.063, 1.694, 0.092), (s * 0.078, 1.703, 0.086), 0.0025, 4), lash, ['Head'], 0.6)
        for i, (dx, dy, ang) in enumerate(((0.03, 0.006, 0.9), (0.034, -0.002, 0.5))):
            part('flick%d_%d' % (s, i), bm_rod((s * (0.036 + dx * 0.9), 1.698 + dy, 0.094), (s * (0.036 + dx * 0.9 + 0.014 * math.cos(ang)), 1.698 + dy + 0.014 * math.sin(ang), 0.094), 0.0025, 4), lash, ['Head'], 0.6)
        # strong arched brows
        part('brow%d' % s, bm_torus(0.036, 0.0045, 12, 5, AZ, (s * 0.039, 1.706, 0.084), sweep=(math.pi * 0.2, math.pi * 0.85), sy=0.55), brow, ['Head'], 0.6)
    # a small nose, full lips with a warm smile, a hint of teeth
    part('nose', capsule((0, 1.705, 0.086), (0, 1.656, 0.109), 0.011, 0.016, 12, 3, 2), skin, ['Head'], 0.6)
    part('nose_tip', ellipsoid((0, 1.654, 0.111), 0.018, 0.015, 0.016, 12, 8), skin, ['Head'], 0.6)
    part('lip_up', ellipsoid((0,1.620,.094),.022,.003,.004,16,5), lip, ['Head'], .6)
    part('lip_lo', ellipsoid((0,1.614,.095),.021,.004,.004,16,5), lip, ['Head'], .6)
    part('mouth_line', capsule((-.021, 1.617, .094), (.021, 1.617, .094), .001, .001, 6, 2, 2), lash, ['Head'], 0.6)
    # the circlet: a thin gold band on the hair with a sun disc at the brow
    part('circlet', bm_torus(0.108, 0.006, 20, 4, AY, (0, 1.745, -0.02), sy=1.15), gold_hi, ['Head'], 0.6)
    part('circlet_disc', bm_cyl(0.016, 0.016, 0.008, 10, AZ, (0, 1.748, 0.1)), gold_hi, ['Head'], 0.6)
    # ---- hair: a cap, side and back sheets, then wavy strands past the shoulders ----
    part('hair_cap', ellipsoid((0, 1.72, -0.035), 0.1, 0.1, 0.13, 18, 7, 0.0, math.pi * 0.5), hair, ['Head'], 0.6)
    part('hair_sides', hair_sheet((0, 1.72, -0.03), 0.1, 0.13, 1.72, 1.5, 0.25, 0.03, 5, 12, flare=0.03, wave=0.01), hair, ['Head', 'Neck'], 0.6)
    part('hair_part', bm_tube(catmull([(0, 1.74, 0.098), (0, 1.79, 0.05), (0, 1.815, -0.02), (0, 1.805, -0.08)], 8), 0.003, 4), skin, ['Head'], 0.6)
    part('hair_mass', hair_sheet((0, 1.5, -0.04), 0.13, 0.16, 1.5, 1.2, 0.28, 0.035, 3, 9, flare=0.02, wave=0.02), hair, HAIRB, 1.6)
    rnd = random.Random(7)
    strands = []
    for i in range(14):
        u = 0.23 + 0.54 * (i + 0.5) / 14        # fraction of a turn from the front, clockwise around the head
        a = u * TAU; side = math.sin(a)
        bones = (['HairL1', 'HairL2', 'Head'] if side > 0.35 else ['HairR1', 'HairR2', 'Head'] if side < -0.35 else ['HairB1', 'HairB2', 'Head'])
        y0 = 1.7; length = 0.5 + 0.2 * (1 - abs(side)) + 0.08 * rnd.random()
        pts = []
        for k in range(8):
            v = k / 7; y = y0 - length * v
            r = 0.105 + 0.045 * math.sin(v * math.pi) + 0.02 * v
            wob = 0.014 * math.sin(v * TAU * 1.2 + i * 1.3) * min(1.0, v * 2.5)
            ang = a + 0.14 * math.sin(v * TAU * 1.0 + i * 0.7) * v
            pts.append(((r + wob) * math.sin(ang), y, -0.03 + (r + wob) * math.cos(ang) * 1.15 - 0.02 * v))
        rad = [0.013, 0.017, 0.018, 0.017, 0.015, 0.012, 0.008, 0.0]
        part('strand%d' % i, bm_tube(catmull(pts, 8), [0.014, 0.018, 0.019, 0.018, 0.016, 0.012, 0.007, 0.0], 5, caps='fan'), hair, bones, 1.3)
        strands.append(pts)
    # ---- bare arms with a gold armband, hands ----
    for side, s in ((L, 1), (Rr, -1)):
        part(side + '_shoulder', ellipsoid((s * 0.19, 1.43, 0), 0.075, 0.07, 0.068, 12, 6), skin, [side + 'Arm', side + 'Shoulder', 'Spine2'])
        part(side + '_arm', capsule((s * 0.2, 1.43, 0), (s * 0.465, 1.43, 0), 0.055, 0.046, 12, 3, 3), skin, [side + 'Arm', side + 'ForeArm', side + 'Shoulder'])
        part(side + '_forearm', capsule((s * 0.455, 1.43, 0), (s * 0.72, 1.43, 0), 0.046, 0.036, 12, 3, 3), skin, [side + 'ForeArm', side + 'Hand', side + 'Arm'])
        part(side + '_hand', rbox((s * 0.785, 1.425, 0), (0.145, 0.08, 0.038), 0.018, 1), skin, [side + 'Hand', side + 'ForeArm'], 0.7)
        part(side + '_thumb', capsule((s * 0.745, 1.425, 0.025), (s * 0.78, 1.425, 0.055), 0.013, 0.011, 8, 3, 2), skin, [side + 'Hand', side + 'ForeArm'], 0.7)
        if s > 0: part('armband', bm_torus(0.06, 0.011, 14, 5, AX, (s * 0.34, 1.43, 0)), gold, [side + 'Arm'], 1.0)
        else: part('bracelet', bm_torus(0.045, 0.008, 12, 4, AX, (s * 0.69, 1.43, 0)), gold, [side + 'ForeArm', side + 'Hand'], 1.0)
        # long legs under the skirt, gold sandals
        part(side + '_thigh', capsule((s * 0.1, 0.93, 0), (s * 0.1, 0.5, 0), 0.072, 0.056, 10, 2, 3), skin, [side + 'UpLeg', side + 'Leg', 'Hips'])
        part(side + '_shin', capsule((s * 0.1, 0.51, 0), (s * 0.1, 0.1, 0), 0.058, 0.045, 10, 2, 3), skin, [side + 'Leg', side + 'Foot', side + 'UpLeg'])
        part(side + '_foot', rbox((s * 0.1, 0.05, 0.075), (0.095, 0.065, 0.25), 0.022, 2), skin, [side + 'Foot', side + 'ToeBase', side + 'Leg'], 0.8)
        part(side + '_sole', rbox((s * 0.1, 0.014, 0.075), (0.105, 0.028, 0.265), 0.01, 1), gold, [side + 'Foot', side + 'ToeBase'], 0.8)
        part(side + '_strap1', bm_box(0.11, 0.012, 0.03, (s * 0.1, 0.07, 0.13)), gold, [side + 'Foot', side + 'ToeBase'], 0.8)
        part(side + '_strap2', bm_box(0.11, 0.012, 0.025, (s * 0.1, 0.082, 0.05)), gold, [side + 'Foot', side + 'Leg'], 0.8)
        part(side + '_anklet', bm_torus(0.062, 0.008, 12, 4, AY, (s * 0.1, 0.11, 0.0)), gold, [side + 'Foot', side + 'Leg'], 0.8)
    # ---- sparkle beads over the robe and hair ----
    rnd = random.Random(11); n = 0
    def bead_at(p, bones, soft):
        nonlocal n
        part('bead%d' % n, bm_uv(0.007, 4, 2, p), bead, bones, soft); n += 1
    for i in range(30):                                   # on the skirt
        v = rnd.random(); th = rnd.random() * TAU
        k = min(len(levels) - 2, int(v * (len(levels) - 1))); f = v * (len(levels) - 1) - k
        (y0, rx0, rz0, _), (y1, rx1, rz1, _) = levels[k], levels[k + 1]
        y = y0 + (y1 - y0) * f; rx = (rx0 + (rx1 - rx0) * f) + 0.012; rz = (rz0 + (rz1 - rz0) * f) + 0.012
        bead_at((rx * math.cos(th), y, rz * math.sin(th)), SKIRT, 2.4)
    for i in range(10):                                   # on the bodice
        th = rnd.random() * TAU; y = 1.14 + rnd.random() * 0.3
        r = hermite([p[1] for p in prof[1:]], [p[0] for p in prof[1:]], y) + 0.012
        bead_at((r * math.cos(th), y, 0.66 * r * math.sin(th) + 0.01), ['Spine1', 'Spine2', 'Spine'], 1.3)
    for i in range(8):                                    # on the cape
        v = rnd.random(); u = rnd.random(); y = 1.45 - v * 0.95; wdt = 0.3 + 0.24 * v
        bead_at((-wdt / 2 + wdt * u, y, -0.12 - 0.17 * v - 0.03), ['Cape1', 'Cape2', 'Spine2'], 2.2)
    for i in range(12):                                   # in the hair
        st = strands[rnd.randrange(len(strands))]; p = st[1 + rnd.randrange(5)]
        side = p[0]
        bones = ['HairL1', 'HairL2', 'Head'] if side > 0.04 else ['HairR1', 'HairR2', 'Head'] if side < -0.04 else HAIRB
        bead_at((p[0] * 1.12, p[1], p[2] * 1.12 - 0.01), bones, 1.3)

def secondary(arm, f, t, P, rig):
    """Hair, skirt and cape follow the body: the skirt's front and back bones swing with the legs, the sides flare,
    the hair and cape trail the motion and flutter on jumps and hits; seated and lying poses fold the skirt over the legs."""
    g = P.ctx.get('gait', 0); ph = P.ctx.get('phase', 0.0); fl = P.ctx.get('flutter', 0.0)
    lL = P.ctx.get('legL', P.legL['thigh']); lR = P.ctx.get('legR', P.legR['thigh'])
    seated = P.ctx.get('seated', False); lying = P.ctx.get('lying', 0.0)
    fwd = max(lL, lR, 0.0); back = max(-lL, -lR, 0.0)
    # skirt
    kf = 1.0 if (seated or lying) else 0.65
    set_rot(arm, 'SkirtF1', Rx(-(fwd * kf + 0.06 * g)), f)
    set_rot(arm, 'SkirtF2', Rx(-(0.12 * g * math.sin(2 * ph + 0.6) + 0.25 * fl + (0.3 if seated else 0.0))), f)
    set_rot(arm, 'SkirtB1', Rx(back * 0.55 + 0.05 * g + 0.15 * fl), f)
    set_rot(arm, 'SkirtB2', Rx(0.12 * g * math.sin(2 * ph + 1.2) + 0.2 * fl), f)
    for name, s, leg in (('SkirtL', 1, lL), ('SkirtR', -1, lR)):
        flare = 0.08 * g + 0.25 * fl + (0.12 if seated else 0.0)
        sway = 0.12 * g * math.sin(ph) if g else 0.03 * math.sin(ph)
        set_rot(arm, name + '1', Ry(-s * (flare + sway * s)) @ Rx(-(max(leg, 0.0) * 1.0 if (seated or lying) else max(leg, 0.0) * 0.25)), f)
        set_rot(arm, name + '2', Ry(-s * (0.1 * g * math.sin(2 * ph + s) + 0.15 * fl)), f)
    # cape: trails behind, flutters
    set_rot(arm, 'Cape1', Rx(0.18 * g + 0.35 * fl + 0.04 * math.sin(2 * ph) + 0.03), f)
    set_rot(arm, 'Cape2', Rx(0.12 * g * math.sin(2 * ph + 1.0) + 0.3 * fl + 0.05 * math.sin(ph * 0.5)), f)
    # hair: the side locks sway, the back trails
    for name, s in (('HairL', 1), ('HairR', -1)):
        set_rot(arm, name + '1', Ry(s * (0.06 * g * math.sin(ph) + 0.02 * math.sin(ph * 0.7))) @ Rx(0.08 * g + 0.2 * fl), f)
        set_rot(arm, name + '2', Ry(s * (0.08 * g * math.sin(2 * ph + 0.8) + 0.15 * fl)) @ Rx(0.06 * g * math.sin(2 * ph + 2.0)), f)
    set_rot(arm, 'HairB1', Rx(0.12 * g + 0.3 * fl + 0.04 * math.sin(2 * ph)) @ Ry(0.04 * g * math.sin(ph)), f)
    set_rot(arm, 'HairB2', Rx(0.1 * g * math.sin(2 * ph + 1.3) + 0.25 * fl), f)

def main():
    clear_scene()
    rig = Rig('chinka', height=1.68, width=0.97)
    extra = [
        ('HairL1', 'Head', (0.09, 1.65, 0.0), (0.11, 1.45, 0.05)), ('HairL2', 'HairL1', (0.11, 1.45, 0.05), (0.12, 1.18, 0.09)),
        ('HairR1', 'Head', (-0.09, 1.65, 0.0), (-0.11, 1.45, 0.05)), ('HairR2', 'HairR1', (-0.11, 1.45, 0.05), (-0.12, 1.18, 0.09)),
        ('HairB1', 'Head', (0.0, 1.62, -0.1), (0.0, 1.42, -0.13)), ('HairB2', 'HairB1', (0.0, 1.42, -0.13), (0.0, 1.12, -0.12)),
        ('SkirtF1', 'Hips', (0.0, 1.0, 0.14), (0.0, 0.5, 0.19)), ('SkirtF2', 'SkirtF1', (0.0, 0.5, 0.19), (0.0, 0.08, 0.27)),
        ('SkirtB1', 'Hips', (0.0, 0.93, -0.15), (0.0, 0.5, -0.21)), ('SkirtB2', 'SkirtB1', (0.0, 0.5, -0.21), (0.0, 0.08, -0.29)),
        ('SkirtL1', 'Hips', (0.21, 1.0, 0.0), (0.25, 0.5, 0.0)), ('SkirtL2', 'SkirtL1', (0.25, 0.5, 0.0), (0.33, 0.08, 0.0)),
        ('SkirtR1', 'Hips', (-0.21, 1.0, 0.0), (-0.25, 0.5, 0.0)), ('SkirtR2', 'SkirtR1', (-0.25, 0.5, 0.0), (-0.33, 0.08, 0.0)),
        ('Cape1', 'Spine2', (0.0, 1.45, -0.13), (0.0, 1.0, -0.2)), ('Cape2', 'Cape1', (0.0, 1.0, -0.2), (0.0, 0.5, -0.3)),
    ]
    rig.extra_bones([(n, p, sc(h), sc(t)) for n, p, h, t in extra])
    rig.secondary = secondary
    build_chinka(rig)
    pv = os.environ.get('CHAR_PREVIEWS'); previews = []
    if pv:
        os.makedirs(pv, exist_ok=True)
        previews = [(os.path.join(pv, 'chinka_rest.png'), None, 1, (0.4, -1, 0.3), 1.0, None),
                    (os.path.join(pv, 'chinka_face.png'), 'idle', 10, (0.4, -1, 0.2), 0.33, (0, -0.02, 1.66 * K)),
                    (os.path.join(pv, 'chinka_side.png'), 'idle', 10, (1, -0.3, 0.2), 1.0, None),
                    (os.path.join(pv, 'chinka_back.png'), 'idle', 10, (-0.4, 1, 0.3), 1.0, None),
                    (os.path.join(pv, 'chinka_walk.png'), 'walk', 8, (0.6, -1, 0.2), 1.0, None),
                    (os.path.join(pv, 'chinka_dance.png'), 'dance', 14, (0.3, -1, 0.3), 1.0, None),
                    (os.path.join(pv, 'chinka_sit.png'), 'sit', 10, (0.9, -1, 0.3), 1.0, None),
                    (os.path.join(pv, 'chinka_captive.png'), 'captive', 20, (-0.3, 1, 0.3), 1.0, None),
                    (os.path.join(pv, 'chinka_photo.png'), 'photo', 12, (0.0, -1, 0.1), 1.0, None),
                    (os.path.join(pv, 'chinka_sleep.png'), 'sleep', 10, (0.3, -1, 0.5), 1.0, None),
                    (os.path.join(pv, 'chinka_drive.png'), 'drive', 10, (0.0, -1, 0.3), 1.0, None)]
    out = os.environ.get('CHAR_OUT') or os.path.join(MODELS, 'chinka.glb')
    blend = os.environ.get('CHAR_BLEND') or os.path.join(BLEND_DIR, 'chinka.blend')
    build(rig, out, blend, previews)

if __name__ == '__main__':
    try: main()
    except Exception as e:
        import traceback; traceback.print_exc(); sys.exit(1)
