# Burning Man hero prop: a chunky motorhome (replaces BurnsProps.rv, 2.5 × 9.6 m, roof 3.3, cab facing +Z).
# Headless:  /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/bm_rv.py
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bmkit import *

L_, W, H = 9.6, 2.5, 3.3          # the procedural rv: len 9..10.5 (fixed here), width 2.5, roof 3.3
ZF, ZB = L_ / 2, -L_ / 2
CAB = ZF - 2.2

def build(B):
    L = B.L
    M_body = paint('body', '#f2ece0', coat=0.4, rough=0.35, metal=0.05)      # recoloured from opts.col by the game
    M_cab = paint('cab', '#f2ece0', coat=0.4, rough=0.35, metal=0.05)
    M_dark = matte('dark', '#26262c'); M_skirt = matte('skirt', '#b8a888', 0.9)
    M_glass = metal('glass', '#1a2232', 0.12); M_lit = led('#ffc070', 2.6)
    M_trim1 = paint('trim1', '#c83a2a', rough=0.3); M_trim2 = paint('trim2', '#2a5aa8', rough=0.3)
    M_alu = metal('alu', '#d8d8de', 0.3); M_grey = satin('grey', '#9a9aa2')
    # dust skirt: a dark chassis tray and a dusty tan band low on the body
    B.obj('chassis', bm_box(W - 0.25, 0.32, L_ - 0.5, (0, 0.48, 0)), M_dark, bevel=0.05)
    B.obj('skirt', bm_box(W + 0.04, 0.34, CAB - ZB - 0.2, (0, 0.82, (CAB + ZB) / 2)), M_skirt, bevel=0.06, bevel_angle=False)
    # bevelled body, the over-cab bunk, the cab and the hood
    body = B.obj('body', bm_box(W, H - 0.72, CAB - ZB, (0, (0.72 + H) / 2, (CAB + ZB) / 2)), M_body, bevel=0.3, bevel_angle=False)
    B.obj('bunk', bm_box(W - 0.06, H - 2.3, ZF - 0.6 - CAB, (0, (2.3 + H) / 2, (CAB + ZF - 0.6) / 2)), M_body, bevel=0.26, bevel_angle=False)
    cab = B.obj('cab', bm_box(W - 0.1, 1.6, 1.3, (0, 1.5, CAB + 0.65)), M_cab, bevel=0.28, bevel_angle=False)
    hood = B.obj('hood', bm_box(W - 0.2, 0.72, 0.9, (0, 1.08, ZF - 0.45)), M_cab, bevel=0.2, bevel_angle=False)
    # wheel arches cut into the body and the cab
    for i, z in enumerate((ZF - 1.0, ZB + 1.9, ZB + 2.6)):
        for s in (1, -1):
            B.cut([body if z < CAB else cab, hood] if z > CAB else [body], bm_cyl(0.6, 0.6, 0.5, L['arch'], AX, (s * 1.2, 0.46, z)), 'arch_%d_%d' % (i, s > 0))
    # windscreen, cab side glass, the hood's chrome bar, headlights and tail lights
    B.obj('windscreen', bm_box(W - 0.35, 0.7, 0.05, (0, 1.85, CAB + 1.31)), M_glass, bevel=0.02)
    for s in (1, -1): B.obj('cab_glass_%d' % (s > 0), bm_box(0.04, 0.6, 0.8, (s * (W / 2 - 0.03), 1.85, CAB + 0.8)), M_glass, bevel=0.015)
    B.obj('grille', bm_box(1.2, 0.35, 0.06, (0, 1.05, ZF + 0.01)), M_dark, bevel=0.02)
    for s in (1, -1):
        B.obj('headlamp_%d' % (s > 0), bm_box(0.34, 0.2, 0.06, (s * 0.85, 1.12, ZF + 0.02)), M_lit, bevel=0.03)
        B.obj('taillamp_%d' % (s > 0), bm_box(0.2, 0.36, 0.05, (s * 1.0, 1.0, ZB - 0.01)), led('#ff2a2a', 2.5), bevel=0.02)
    # bumpers with a chrome strip
    for z in (ZF + 0.06, ZB - 0.02):
        B.obj('bumper_%d' % (z > 0), bm_box(W - 0.04, 0.24, 0.2, (0, 0.61, z)), M_dark, bevel=0.08, bevel_angle=False)
        B.obj('bumper_strip_%d' % (z > 0), bm_box(W * 0.84, 0.05, 0.03, (0, 0.64, z + (0.1 if z > 0 else -0.1))), chrome())
    # windows: dark rubber frames with inset glowing panels (three along each side + the bunk window)
    def window(name, s, y, z, w, h, lit):
        B.obj(name + '_frame', bm_box(0.03, h + 0.1, w + 0.1, (s * (W / 2 + 0.005), y, z)), matte('frame', '#1e1e24', 0.6))
        B.obj(name + '_glass', bm_box(0.03, h, w, (s * (W / 2 + 0.02), y, z)), M_lit if lit else M_glass, bevel=0.012)
    for i in range(3):
        z = ZB + 1.4 + i * (CAB - ZB - 2) / 2.2
        for s in (1, -1): window('win_%d_%d' % (i, s > 0), s, 2.2, z, 1.0, 0.55, (i + (s > 0)) % 2 == 0)
    for s in (1, -1): window('bunk_win_%d' % (s > 0), s, 2.6, (CAB + ZF - 0.6) / 2, 0.8, 0.35, s < 0)
    # the door on the right (-X) with its own small window, a grab handle and a fold-down step
    B.obj('door', bm_box(0.04, 1.8, 0.75, (-W / 2 - 0.01, 1.6, CAB - 1.0)), paint('door', '#ddd6c6', coat=0.3, rough=0.4), bevel=0.02)
    window('door_win', -1, 2.1, CAB - 1.0, 0.4, 0.45, False)
    B.obj('handle', bm_rod((-W / 2 - 0.06, 1.45, CAB - 1.25), (-W / 2 - 0.06, 1.45, CAB - 1.05), 0.018, L['rod']), chrome())
    B.obj('step', bm_box(0.4, 0.08, 0.7, (-W / 2 - 0.2, 0.5, CAB - 1.0)), matte('step', '#3a3a40'), bevel=0.02)
    # stripes: two accent lines along both sides, and a swoosh that kicks up toward the cab
    for s in (1, -1):
        x = s * (W / 2 + 0.01)
        B.obj('stripe1_%d' % (s > 0), bm_box(0.02, 0.1, CAB - ZB - 0.4, (x, 1.12, (CAB + ZB) / 2)), M_trim1, bevel=0.008)
        B.obj('stripe2_%d' % (s > 0), bm_box(0.02, 0.06, CAB - ZB - 0.4, (x, 1.3, (CAB + ZB) / 2)), M_trim2, bevel=0.008)
        # profile (x, y) rotated by yaw 90°: its x runs along -Z, so pass (-z, y); CCW seen from +X
        zs = [(-3.2, 1.45), (0.4, 1.45), (1.6, 2.05), (1.8, 2.05), (0.7, 1.52), (-3.2, 1.52)]
        B.obj('swoosh_%d' % (s > 0), bm_profile([(-pz, py) for pz, py in reversed(zs)], 0.02, (x, 0, 0.3), M=rot(yaw=math.pi / 2)), M_trim1)
    # wheels: chunky tyres, bevelled rims, hub caps
    for i, z in enumerate((ZF - 1.0, ZB + 1.9, ZB + 2.6)):
        for s in (1, -1):
            x = s * (W / 2 - 0.13)
            B.obj('tyre_%d_%d' % (i, s > 0), bm_cyl(0.46, 0.46, 0.3, L['cyl'], AX, (x, 0.46, z)), rubber(), bevel=0.1)
            B.obj('rim_%d_%d' % (i, s > 0), bm_cyl(0.26, 0.26, 0.26, L['cyl_s'], AX, (x, 0.46, z)), M_alu, bevel=0.03)
            B.obj('hub_%d_%d' % (i, s > 0), bm_cyl(0.08, 0.08, 0.3, 8, AX, (x, 0.46, z)), M_grey)
    # roof: a soft cap, the AC shroud with its fan grille, a vent, a solar panel
    B.obj('roofcap', bm_box(W - 0.2, 0.14, CAB - 0.25 - (ZB + 0.45), (0, H + 0.02, (ZB + 0.45 + CAB - 0.25) / 2)), M_body, bevel=0.07, bevel_angle=False)
    acz = (CAB + ZB) / 2 + 0.5
    B.obj('ac', bm_box(0.8, 0.32, 0.9, (0, H + 0.22, acz)), satin('ac', '#ececf0', 0.45), bevel=0.08, bevel_angle=False)
    B.obj('ac_fan', bm_cyl(0.22, 0.22, 0.03, L['cyl_s'], AY, (0, H + 0.385, acz)), matte('ac_grille', '#3a3a42', 0.6))
    for k in range(-2, 3): B.obj('louvre_%d' % (k + 2), bm_box(0.02, 0.16, 0.06, (0.41, H + 0.22, acz + k * 0.15)), matte('ac_grille', '#3a3a42', 0.6))
    B.obj('vent', bm_box(0.4, 0.14, 0.4, (0.6, H + 0.1, ZB + 1.2)), satin('vent', '#c8c8c8'), bevel=0.03)
    B.obj('solar', bm_box(1.6, 0.06, 1.2, (0, H + 0.1, ZB + 2.6)), mat('solar', '#1a2a5a', rough=0.15, metal=0.6, emit='#2a3a6a', strength=0.2), bevel=0.015)
    # the awning on the right (-X): a rolled case on the wall and a half-open canvas on two arms
    B.obj('awning_case', bm_rod((-W / 2 - 0.09, H - 0.32, ZB + 1.0), (-W / 2 - 0.09, H - 0.32, CAB - 1.6), 0.075, L['cyl_s']), satin('awning_case', '#e8e8ec'))
    for zz in (ZB + 1.0, CAB - 1.6): B.obj('awning_br_%d' % (zz > 0), bm_box(0.08, 0.14, 0.06, (-W / 2 - 0.04, H - 0.32, zz)), M_grey, bevel=0.015)
    aw0, aw1 = ZB + 1.1, CAB - 1.7
    sheet = bm_surf(2, 6, lambda u, v: (-W / 2 - 0.1 - u * 1.6, H - 0.36 - u * 0.42 - math.sin(math.pi * v) * 0.04 * (0.3 + u), aw0 + (aw1 - aw0) * v))
    B.obj('awning', merge(sheet, flip(bm_surf(2, 6, lambda u, v: (-W / 2 - 0.1 - u * 1.6, H - 0.37 - u * 0.42 - math.sin(math.pi * v) * 0.04 * (0.3 + u), aw0 + (aw1 - aw0) * v)))), mat('awning', '#c86a3a', rough=0.75))
    for zz in (aw0 + 0.05, aw1 - 0.05):
        B.obj('awning_arm_%d' % (zz > 0), bm_rod((-W / 2 - 0.12, H - 1.1, zz), (-W / 2 - 1.7, H - 0.8, zz), 0.022, L['rod']), M_alu)
    B.obj('awning_bar', bm_rod((-W / 2 - 1.7, H - 0.78, aw0), (-W / 2 - 1.7, H - 0.78, aw1), 0.03, L['rod']), M_alu)
    # rear ladder and the bike rack shelf
    for lx in (0.35, 0.7): B.obj('ladder_rail_%d' % int(lx * 100), bm_rod((lx, 0.9, ZB - 0.07), (lx, H - 0.02, ZB - 0.07), 0.022, L['rod']), M_alu)
    y = 1.2
    while y < H: B.obj('rung_%d' % int(y * 100), bm_rod((0.35, y, ZB - 0.07), (0.7, y, ZB - 0.07), 0.016, 5), M_alu); y += 0.35
    B.obj('rack', bm_box(1.7, 0.08, 0.5, (-0.2, 0.95, ZB - 0.32)), M_dark, bevel=0.02)
    for s in (1, -1): B.obj('rack_arm_%d' % (s > 0), bm_rod((-0.2 + s * 0.7, 0.95, ZB - 0.1), (-0.2 + s * 0.7, 1.9, ZB - 0.22), 0.02, 5), M_dark)
    # side mirrors
    for s in (1, -1):
        B.obj('mirror_arm_%d' % (s > 0), bm_rod((s * (W / 2 - 0.05), 1.95, CAB + 1.2), (s * (W / 2 + 0.35), 2.0, CAB + 1.2), 0.02, 5), M_dark)
        B.obj('mirror_%d' % (s > 0), bm_box(0.06, 0.3, 0.2, (s * (W / 2 + 0.38), 2.0, CAB + 1.2)), M_dark, bevel=0.02)

if __name__ == '__main__':
    run_static('rv', build)
