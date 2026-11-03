# Kit demo: a playa lamp post with a catenary string of bulbs (a static Burning Man prop, not a car). Exercises every
# cartkit helper that the car scripts used to write locally: aim/frame, catmull/hermite/catenary/arc_walk, bm_tube,
# bm_sweep, bm_loft, bm_surf(merge=True), bm_capsule, bm_rrect_tube/rrect_pts, Build.obj(flat=…, face_mat=…),
# run_static(report=True, views=…).
# Headless:  /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/kit_demo.py
# Writes assets/models/burning-man/kit_demo.glb (single bone `body`), assets/blender/kit_demo.blend, shots/blender/kit_demo_*.png.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cartkit import *

POST_H = 4.4                                   # the post's height (engine y)
ARM = [(0, POST_H - 0.1, 0), (0, POST_H + 0.35, 0.45), (0, POST_H + 0.4, 1.1), (0, POST_H + 0.15, 1.6)]   # gooseneck knots
STAKE = (0, 2.2, 5.5)                          # where the bulb string is tied off
BULBS = ['#ffe24a', '#ff4fd8', '#38f2ff', '#7aff5a']

def build(B):
    L = B.L
    M_iron = metal('iron', '#2e2a2c', 0.45); M_brass = metal('brass', '#c9983a', 0.18)
    M_stripe = [paint('stripe_red', '#d8303a'), paint('stripe_cream', '#f2e8d0')]
    M_sign = [paint('sign_face', '#1a3a6a'), M_brass]
    M_shade = mat('shade', '#3a2a1a', rough=0.6, metal=0.3); M_globe = glow('globe', '#fff0c0', strength=2.5)
    M_gem = mat('gem', '#38f2ff', rough=0.05, coat=1.0, emit='#38f2ff', strength=0.6); M_wire = rubber()
    M_tinsel = metal('tinsel', '#ff7ad8', 0.2)

    # ---- plinth: a lathe with twelve alternating stripes picked per face (face_mat) ----
    plinth = bm_lathe([(0.0, 0.0), (0.42, 0.0), (0.42, 0.3), (0.3, 0.42), (0.0, 0.42)], L['cyl'])
    B.obj('plinth', plinth, M_stripe, face_mat=lambda f: (int((math.atan2(f.calc_center_median().y, f.calc_center_median().x) % TAU) / TAU * 12) % 2) if abs(f.normal.z) < 0.7 else 1, bevel=0.02)
    # ---- post: a tapered lathe whose profile is a smooth Hermite curve through four radius knots ----
    ks, rs = [0.4, 1.5, 3.0, POST_H], [0.14, 0.1, 0.085, 0.07]
    prof = [(hermite(ks, rs, y), y) for y in (0.4 + (POST_H - 0.4) * i / 10 for i in range(11))]
    B.obj('post', bm_lathe([(0.0, 0.4)] + prof + [(0.0, POST_H)], L['cyl_s']), M_iron)
    B.obj('collar', bm_torus(0.11, 0.025, L['torus'], L['tube'], AY, (0, POST_H - 0.12, 0)), M_brass)
    # ---- finial: a faceted gem that stays flat-shaded through smooth_by_angle ----
    B.obj('finial', bm_ico(0.13, 2, (0, POST_H + 0.12, 0)), M_gem, flat=True)
    # ---- tinsel garland: a star section swept up a helix around the post, collapsing to a tip at both ends ----
    turns = 3.0
    def helix(u): a = TAU * turns * u; return (math.sin(a) * 0.16, 0.6 + 3.3 * u, math.cos(a) * 0.16)
    star = [((0.05 if j % 2 else 0.02) * math.cos(TAU * j / 10), (0.05 if j % 2 else 0.02) * math.sin(TAU * j / 10)) for j in range(10)]
    B.obj('garland', bm_sweep(helix, lambda u: None if u in (0.0, 1.0) else star, B.pick(96, 48)), M_tinsel)
    # ---- gooseneck arm: a tube along a Catmull-Rom path, thinner towards the lamp, a little oval ----
    path = catmull(ARM, 18); radii = [0.06 - 0.025 * i / 17 for i in range(18)]
    B.obj('arm', bm_tube(path, radii, L['rod'], section_fn=lambda u: (1.0, 0.85)), M_iron)
    # a bracket box under the arm, aimed along the arm with frame(): local z along the arm, y down the normal
    t = Vector(path[6]) - Vector(path[5]); t.normalize(); up = Vector((0, 1, 0)); n = (up - t * up.dot(t)).normalized()
    B.obj('bracket', bm_box(0.08, 0.05, 0.3, tuple(Vector(path[5]) - n * 0.05), M=frame(tuple(t.cross(n)), tuple(n), tuple(t))), M_brass)
    # ---- lamp head: a shade lofted from a tip to a hexagon to a round rim, then a glowing globe (bm_surf, merged poles) ----
    tip = (ARM[-1][0], ARM[-1][1] - 0.05, ARM[-1][2]); hx, hz, hy = tip[0], tip[2], tip[1]
    rings = [[tip]]
    for rr, dy, segs in ((0.1, -0.08, 6), (0.26, -0.3, 6), (0.3, -0.4, 6)):
        rings.append([(hx + rr * math.cos(TAU * j / 24), hy + dy, hz + rr * math.sin(TAU * j / 24)) for j in range(24)])
    B.obj('shade', bm_loft(rings, caps=False), M_shade)
    B.obj('shade_rim', bm_torus(0.3, 0.015, L['torus'], L['tube'], AY, (hx, hy - 0.4, hz)), M_brass)
    def globe(u, v):
        ph = math.pi * v; r = 0.2 * (1 + 0.15 * math.sin(ph))
        return (hx + r * math.sin(ph) * math.cos(TAU * u), hy - 0.42 + 0.22 * math.cos(ph), hz + r * math.sin(ph) * math.sin(TAU * u))
    B.obj('globe', bm_surf(L['surf'] // 2 * 2, L['surf'] // 2, globe, wrap_u=True, merge=True), M_globe)
    B.light(hx, hy - 0.5, hz, 3.0, '#fff0c0', big=1)
    # ---- a rounded-rectangle sign hanging under the arm: a tube frame and a two-material plate ----
    sp = (0, POST_H - 0.3, 0.75)
    B.obj('sign_frame', bm_rrect_tube(0.9, 0.46, 0.1, 0.014, 4, L['tube'], at=sp, axis=AZ), M_brass)
    B.obj('sign_plate', bm_profile(rrect_pts(0.86, 0.42, 0.08, 4), 0.02, at=sp), M_sign, face_mat=lambda f: 0 if abs(f.normal.y) > 0.5 else 1)
    for s in (1, -1): B.obj('sign_chain_%d' % (s > 0), bm_rod((s * 0.3, POST_H - 0.07, 0.75), (s * 0.3, POST_H + 0.22, 0.75), 0.008, 4), M_iron, smooth=False)
    # ---- the bulb string: a catenary wire from the lamp head to a stake, bulbs spaced evenly by arc length ----
    a = (hx, hy - 0.05, hz + 0.05); wire = catenary(a, STAKE, 0.7, 40)
    B.obj('wire', bm_tube(wire, 0.008, 4, caps=False), M_wire, smooth=False)
    def cat(t): return tuple(Vector(a).lerp(Vector(STAKE), t) - Vector((0, 0.7 * (1 - (2 * t - 1) ** 2), 0)))   # the same wire as a function of t
    for i, t in enumerate(arc_walk(cat, 16)[1:-1]):
        p = Vector(cat(t)); c = BULBS[i % len(BULBS)]
        B.obj('socket_%d' % i, bm_cyl(0.018, 0.018, 0.04, 6, AY, tuple(p - Vector((0, 0.02, 0)))), M_iron)
        B.obj('bulb_%d' % i, bm_capsule(0.032, 0.11, 8, 3, at=tuple(p - Vector((0, 0.1, 0))), axis=aim((0, -1, 0))), led(c), parent=None)
        if i % 4 == 1: B.light(p.x, p.y - 0.1, p.z, 0.4, c, led=1)
    # ---- the stake: a short aimed post leaning back against the pull of the wire, with a capsule cap ----
    lean = (0, 1, -0.18)
    B.obj('stake', bm_cyl(0.05, 0.035, 2.2, L['cyl_s'], aim(lean), (STAKE[0], STAKE[1] / 2, STAKE[2] + 0.2)), M_iron)
    B.obj('stake_cap', bm_capsule(0.045, 0.14, L['cyl_s'], 3, at=STAKE, axis=aim(lean)), M_brass)

if __name__ == '__main__':
    run_static('kit_demo', build, app='burning-man', report=True, views=['front', 'side', 'top'])
