# aq_enemies: the Antarctica cast of Super Brady-O World (secret world 13) for the pre-rendered Fiesta Toon pipeline.
# All original cartoon designs (polar animals and station gear). Same conventions as jp_enemies.py / np_enemies.py
# (helpers in jp_charkit.py): Z up, characters FACE +X, camera along +Y; feet-origin kinds stand on z = 0,
# centre-origin kinds are centred; materials <kind>_<part>, 'glow' materials unlit; one Empty per kind.
# Values are kept apart from the snow: every animal has a dark mass (black, slate, brown) or a strong colour, so it
# reads against white ice, the pale sky and the night station alike.
#
#   skua      a brown skua: chocolate plumage, white flashes on the wings, a hooked dark beak     fly swoop stun ko  centre
#   seal      a leopard seal popping out of an ice hole: spotted slate back, pale belly, a big grin up down ko  centre
#   snowball  a packed snowball with an icy cowlick of crystals and frost-blue cheeks          walk curl roll stun flat ko
#   rover     the station's runaway research rover: red-and-white body on two tracks, a camera head with two lens
#             eyes, a green-lit antenna (2 hp)                                                 walk stun flat ko
#   orca      a cheeky orca leaping from the sea: black and white, tall dorsal fin              up down ko         centre
#   skidder   an Adelie penguin skidding on its belly (Big Tusk's phase-2 minion)              walk stun flat ko
#   penguin   the friend (aqPenguin): an Adelie penguin who flaps to teach the belly-slide (idle) and waves once it
#             has lent it (wave); level overhaul: the conga-line belly-sliders also draw from it
#                                                                             idle wave walk slide stun flat ko
#   coin      the SNOWFLAKE: a chunky six-armed ice-blue snowflake, spinning about Z           spin               centre
#   star      the GOLDEN PENGUIN: a little gold penguin statuette, hovering with sparkles       idle (hover)       centre
#   qblock    the item block: a clear blue ice block with a frosted rim and a snowflake frozen in each face
#                                                                                               idle (frame 000)   centre
#   used      the same block spent: frosted, grey-blue and cracked                             idle               centre
import math
import os
import sys

import bpy
from mathutils import Matrix, Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import jp_charkit as M
from jp_charkit import (TAU, X, Y, Z, V, T, diag, rot_x, rot_y, rot_z, about, ellipsoid, sphere, blob, ell_cap, tube, cone,
                        lathe, torus, prism, lathe_surf, ellipsoid_surf, oval_patch, make_part, new_root, eye_one, brow,
                        mouth_bm, biped_legs, superellipsoid, box_bm, perp_frame, smooth01, xf)
import jp_enemies as JE
from jp_enemies import STD_POSE, walk_bob, face_frame, flat_mouth
import np_enemies as NE

PX = 28.1
KINDS = ['skua', 'seal', 'snowball', 'rover', 'orca', 'skidder', 'penguin', 'coin', 'star', 'qblock', 'used']
POSES = {
    'skua': ['fly', 'swoop', 'stun', 'ko'],
    'seal': ['up', 'down', 'ko'],
    'snowball': ['walk', 'curl', 'roll', 'stun', 'flat', 'ko'],
    'rover': ['walk', 'stun', 'flat', 'ko'],
    'orca': ['up', 'down', 'ko'],
    'skidder': ['walk', 'stun', 'flat', 'ko'],
    'penguin': ['idle', 'wave', 'walk', 'slide', 'stun', 'flat', 'ko'],
    'coin': ['spin'],
    'star': ['idle'],
    'qblock': ['idle'],
    'used': ['idle'],
}
FRAMES = {('qblock', 'idle'): (1, 1), ('used', 'idle'): (1, 1), ('skidder', 'walk'): (6, 12), ('penguin', 'slide'): (6, 12),
          ('penguin', 'idle'): (6, 8), ('penguin', 'wave'): (6, 6), ('rover', 'walk'): (6, 10)}
ORIGIN = {k: 'feet' for k in KINDS}
ORIGIN.update({'skua': 'centre', 'seal': 'centre', 'orca': 'centre', 'coin': 'centre', 'star': 'centre', 'qblock': 'centre', 'used': 'centre'})
HEIGHT = {'snowball': 22 / PX, 'rover': 26 / PX, 'skidder': 18 / PX, 'penguin': 40 / PX}
SIZE = dict(HEIGHT)
SIZE.update({'skua': 32 / PX, 'seal': 30 / PX, 'orca': 40 / PX, 'coin': 16 / PX, 'star': 24 / PX, 'qblock': 32 / PX, 'used': 32 / PX,
             'skidder': 30 / PX})

COLORS = {
    'jp_tongue': '#ff7a8a',
    'skua_body': '#6a4a34', 'skua_body2': '#8a6446', 'skua_wing': '#4e3424', 'skua_tip': '#7a5a40', 'skua_head': '#4a3224',
    'skua_beak': '#2a2228', 'skua_feet': '#2a2228', 'skua_flash': '#f6efe2',
    'skua_eye_white': '#fbfbf2', 'skua_pupil': '#1a1020', 'skua_mouth': '#2a2030',
    'seal_body': '#7a8aa0', 'seal_spot': '#3e4a5e', 'seal_belly': '#dfe7ef', 'seal_flipper': '#5e6c82', 'seal_tooth': '#ffffff',
    'seal_gum': '#c8506a', 'seal_nose': '#2a2a36', 'seal_eye_white': '#fbfbf2', 'seal_pupil': '#1a1020', 'seal_mouth': '#5a1a2a',
    'snowball_snow': '#f2f8ff', 'snowball_shade': '#b8d0ee', 'snowball_ice': '#8ad0f8', 'snowball_ice2': '#c8f0ff',
    'snowball_cheek': '#9ac8f0', 'snowball_feet': '#c8dcf2',
    'snowball_eye_white': '#ffffff', 'snowball_pupil': '#1a1a2e', 'snowball_mouth': '#3a4a7a',
    'rover_red': '#e0402e', 'rover_red2': '#b8301e', 'rover_white': '#eef2f6', 'rover_grey': '#8a94a2', 'rover_track': '#2a2c36',
    'rover_wheel': '#a8b0bc', 'rover_hub': '#ffd23a', 'rover_lens': '#1e2a3a', 'rover_glow': '#5affb0', 'rover_panel': '#2a5ad8',
    'rover_eye_white': '#e8fff4', 'rover_pupil': '#10202a', 'rover_mouth': '#2a2c36',
    'orca_black': '#16161e', 'orca_white': '#f4f8fc', 'orca_grey': '#5a6070', 'orca_mouth': '#c8506a',
    'orca_eye_white': '#fbfbf2', 'orca_pupil': '#1a1020',
    'skidder_black': '#1c2030', 'skidder_white': '#ffffff', 'skidder_beak': '#ff8a3a', 'skidder_feet': '#ff9a6a',
    'skidder_dust': '#e8f6ff', 'skidder_eye_white': '#ffffff', 'skidder_pupil': '#1a1020', 'skidder_mouth': '#8a2a1a',
    'penguin_black': '#1c2030', 'penguin_white': '#ffffff', 'penguin_beak': '#ff8a3a', 'penguin_feet': '#ff9a6a',
    'penguin_dust': '#e8f6ff', 'penguin_cheek': '#ff9ab0', 'penguin_eye_white': '#ffffff', 'penguin_pupil': '#1a1020',
    'penguin_mouth': '#8a2a1a',
    'coin_ice': '#4ab0f0', 'coin_ice2': '#c4f0ff', 'coin_core': '#1a5ac8', 'coin_shine': '#ffffff',
    'star_gold': '#ffd24a', 'star_gold2': '#ffe890', 'star_core': '#d89a20', 'star_beak': '#ff9a3a', 'star_glow': '#fff6c0',
    'star_eye': '#5a3a10',
    'qblock_ice': '#9ad8f8', 'qblock_ice2': '#c8ecff', 'qblock_frost': '#f4fbff', 'qblock_flake': '#2a7ad0', 'qblock_flake2': '#ffffff',
    'used_ice': '#8a9cb0', 'used_ice2': '#a8b8c8', 'used_frost': '#c8d2dc', 'used_crack': '#5a6a7e',
}


def use():
    M.use(COLORS, KINDS)


use()


def clear(kind=None):
    use()
    M.clear(kind)


# ================================================================ SKUA (flyer): the bird body of np_enemies, browns
def build_skua(root, pose, t):
    Mx, hc = NE.bird('skua', root, pose, t, 'skua_body', 'skua_body2', 'skua_wing', 'skua_tip', 'skua_head', 'skua_beak', 'skua_feet',
                     er=0.075, scale=1.0)
    # the white flashes at the base of the primaries (on the near wing) and a hooked beak tip
    flap = {'fly': math.sin(TAU * t), 'swoop': -0.9, 'stun': -0.6}.get(pose, -0.5)
    sh = V(-0.02, 0, 0.04)
    w = JE.crow_wing(sh, flap)
    tipc = sh + (w[6] - sh) * 0.72
    a, b = sh + (w[3] - sh) * 0.7, sh + (w[9] - sh) * 0.75
    ob = make_part('flash', prism([a, tipc, b, sh + (tipc - sh) * 0.55][::-1], Y * 0.02), 'skua_flash', root, Mx @ T((0, -0.215, 0)), subsurf=1)
    ob['outline'] = 0
    make_part('hook', cone(hc + V(0.27, 0, -0.04), hc + V(0.3, 0, -0.1), 0.025, seg=6), 'skua_beak', root, Mx, subsurf=0)


# ================================================================ PENGUIN (Adelie): friend, skidder, conga
PEN = [(0.0, 0.03), (0.2, 0.04), (0.28, 0.13), (0.31, 0.3), (0.29, 0.48), (0.23, 0.62), (0.15, 0.72), (0.0, 0.76)]


def penguin_parts(kind, root, Mx, P, t, flip_near=30.0, flip_far=30.0, feet='stand', beak_open=0.0, head_tilt=0.0,
                  feet_back=False, scarf=False):
    """An Adelie penguin about 1 m tall (before Mx): a black pear of a body with a white front, a black head with big
    white-ringed eyes, an orange beak, flippers, orange feet. Mx places it; flip_* are the flipper angles (deg, 0 =
    hanging down, positive = forward/up)."""
    blk, wht = kind + '_black', kind + '_white'
    make_part('body', lathe(PEN, seg=26), blk, root, Mx)
    surf = lathe_surf(PEN)
    make_part('front', oval_patch(surf, 0.36, 0.3, -0.62, 0.95, rows=10, cols=14), wht, root, Mx)
    make_part('tail', cone(V(-0.24, 0, 0.12), V(-0.4, 0, 0.04), 0.07, flat=0.5, seg=8), blk, root, Mx, subsurf=1)
    # head
    neck = V(0.02, 0, 0.66)
    HM = Mx @ about(neck, rot_y(head_tilt))
    hc, hr = V(0.06, 0, 0.88), 0.21
    make_part('head', sphere(hc, hr, seg=22, rows=12), blk, root, HM)
    hsurf = ellipsoid_surf(hc, hr, hr, hr)
    make_part('chin', oval_patch(hsurf, hc.z - 0.13, 0.06, -0.55, 0.55, thick=0.014), wht, root, HM)
    for side, az, dz in (('r', -0.62, 0.035), ('l', -1.38, 0.045)):
        p, n = hsurf(hc.z + dz, az)
        eye_one(kind, side, p - n * 0.006, n, root, HM, P)
    if P.get('blush'):
        for k, az in enumerate((-0.35, -1.7)):
            make_part('cheek%d' % k, oval_patch(hsurf, hc.z - 0.06, 0.03, az, 0.14, thick=0.016), 'penguin_cheek', root, HM)
    bk = hc + V(hr - 0.03, 0, -0.03)
    o = beak_open
    make_part('beak_top', cone(bk + V(0, 0, 0.012), bk + V(0.17, 0, -0.01 + 0.02 * o), 0.05, flat=0.8, seg=10), kind + '_beak', root, HM)
    make_part('beak_bot', cone(bk + V(0, 0, -0.018), bk + V(0.13, 0, -0.05 - 0.06 * o), 0.035, flat=0.8, seg=10), kind + '_beak', root, HM)
    if o > 0.2:
        make_part('mouthin', sphere(bk + V(0.04, 0, -0.03), 0.028, seg=8, rows=5), kind + '_mouth', root, HM, subsurf=0)
    if scarf:
        sc = V(0.03, 0, 0.66)
        make_part('scarf', torus(sc, 0.26, 0.08, axis=Vector((0.1, 0, 1)), seg=22, rseg=8), 'congaLead_scarf', root, Mx)
        flap = 0.04 * math.sin(TAU * t)
        end = [sc + V(-0.3, -0.16, -0.06), sc + V(-0.38 - flap, -0.18, -0.3), sc + V(-0.44 - 2 * flap, -0.18, -0.54)]   # streams back over the slider's back
        make_part('scarf_end', tube(end, 0.075, 0.06, seg=8), 'congaLead_scarf', root, Mx)
        for k in range(2):
            make_part('scarf_st%d' % k, box_bm((0.04, 0.13, 0.12)), 'congaLead_scarf2', root, Mx @ T(end[1] + (end[2] - end[1]) * (0.3 + 0.4 * k)), subsurf=0)
    # flippers: flat paddles from the shoulders, near one white-edged
    for side, y, ang in (('far', 0.25, flip_far), ('near', -0.27, flip_near)):
        sh = V(0.0, y, 0.6)
        FM = Mx @ about(sh, rot_y(-ang))
        make_part('flip_' + side, ellipsoid(sh + V(0.0, 0, -0.2), X * 0.075, Y * 0.03, Z * 0.21, seg=12, rows=8), blk, root, FM)
    # feet
    for k, (y, ph) in enumerate(((-0.11, 0.0), (0.11, math.pi))):
        dx, dz = 0.0, 0.0
        if feet == 'walk':
            dx, dz = 0.07 * math.sin(TAU * t + ph), 0.04 * max(0.0, math.cos(TAU * t + ph))
        elif feet == 'flat':
            dx = 0.12 if k == 0 else -0.08
        fc = V(0.1 + dx, y, 0.03 + dz) if not feet_back else V(-0.02, y, 0.0)
        FM = Mx if not feet_back else Mx @ about(V(0, 0, 0.04), rot_y(-70))
        make_part('foot%d' % k, ellipsoid(fc, X * 0.12, Y * 0.06, Z * 0.035, seg=12, rows=6), kind + '_feet', root, FM, subsurf=1)
    return HM, hc


def penguin_pose(kind, root, pose, t, s=1.0):
    P = dict(STD_POSE.get(pose, STD_POSE['idle']))
    P.update(er=0.082, skin=kind + '_black')
    P['lid'] = min(P['lid'], 0.15) if pose not in ('flat', 'wave') else P['lid']
    if pose in ('slide', 'walk') and kind != 'penguin':
        pass
    if pose == 'idle':
        # flapping both flippers to say "watch me!" and bouncing on the spot
        f = math.sin(TAU * t)
        bob = 0.03 * abs(f)
        P['blush'] = True
        Mx = T((0, 0, bob)) @ diag(s, s, s)
        penguin_parts(kind, root, Mx, P, t, flip_near=45 + 35 * f, flip_far=45 - 35 * f, beak_open=0.6)
        return
    if pose == 'wave':
        P['lid'] = 1.0
        P['blush'] = True
        Mx = T((0, 0, 0.01 * math.sin(TAU * t))) @ diag(s, s, s)
        penguin_parts(kind, root, Mx, P, t, flip_near=85 + 28 * math.sin(TAU * t), flip_far=-20, beak_open=0.7, head_tilt=-6)
        return
    if pose == 'walk':
        bob = 0.025 * abs(math.sin(TAU * t))
        Mx = T((0, 0, bob)) @ about((0, 0, 0), rot_y(6 * math.sin(TAU * t))) @ diag(s, s, s)
        penguin_parts(kind, root, Mx, P, t, flip_near=25 + 10 * math.sin(TAU * t), flip_far=25 - 10 * math.sin(TAU * t), feet='walk')
        return
    if pose in ('slide', 'skid'):
        # flat on its belly, head up looking ahead, flippers swept back, feet trailing
        bob = 0.012 * math.sin(TAU * t * 2)
        Mx = T((-0.4 * s, 0, (0.3 + bob) * s)) @ diag(s, s, s) @ rot_y(88)
        flap = 6 * math.sin(TAU * t)
        P['lid'] = 0.0
        P['eye'] = 1.08
        penguin_parts(kind, root, Mx, P, t, flip_near=-155 + flap, flip_far=-150 - flap, head_tilt=-74, feet_back=True,
                      beak_open=0.5, scarf=(kind == 'congaLead'))
        # a spray of snow kicked up under the tail
        for k in range(3):
            ph = (t + k / 3) % 1
            ob = make_part('dust%d' % k, sphere(V((-0.55 - 0.3 * ph) * s, -0.15, (0.05 + 0.12 * ph) * s), (0.06 + 0.06 * ph) * s, seg=10, rows=6),
                           kind + '_dust', root, None, subsurf=1)
            ob['outline'] = 0.4
        return
    if pose == 'stun':
        P['dazed'] = True
        Mx = about((0, 0, 0), rot_y(-8)) @ diag(s, s, s)
        if kind != 'penguin':
            Mx = T((0, 0, 0)) @ diag(s * 0.85, s * 0.85, s * 0.85)
        penguin_parts(kind, root, Mx, P, t, flip_near=70, flip_far=60, beak_open=0.4, head_tilt=8)
        return
    if pose == 'flat':
        Mx = diag(s * 1.3, s * 1.3, s * 0.38)
        penguin_parts(kind, root, Mx, P, t, flip_near=90, flip_far=90, feet='flat')
        return
    # ko
    P['x'] = True
    Mx = about((0, 0, 0.4 * s), rot_y(-14)) @ diag(s, s, s)
    if kind != 'penguin':
        Mx = diag(s * 0.85, s * 0.85, s * 0.85) @ about((0, 0, 0.4), rot_y(-14))
    penguin_parts(kind, root, Mx, P, t, flip_near=120, flip_far=110, feet='flat', beak_open=0.8)


def build_penguin(root, pose, t):
    penguin_pose('penguin', root, pose, t, s=1.32)


def build_skidder(root, pose, t):
    penguin_pose('skidder', root, 'skid' if pose == 'walk' else pose, t, s=0.92)


# ================================================================ SEAL (leaper): a leopard seal
def build_seal(root, pose, t):
    P = {'er': 0.07, 'skin': 'seal_body', 'lid': 0.0, 'look': Vector((0.6, -0.8, 0.0))}
    wig = 10 * math.sin(TAU * t)
    if pose == 'up':
        Mx = rot_y(-72)
    elif pose == 'down':
        Mx = rot_y(72)
        wig *= 0.5
    else:
        Mx = rot_y(170)
        P['x'] = True
    # modelled lying along +X, side to the camera; the pose stands it nose-up or nose-down
    bc, rad = V(-0.04, 0, 0.0), (0.38, 0.17, 0.18)
    make_part('body', blob(bc, *rad, seg=26, rows=12), 'seal_body', root, Mx)
    surf = ellipsoid_surf(bc, *rad)
    make_part('belly', oval_patch(surf, -0.06, 0.08, -1.55, 0.95, rows=6, cols=14), 'seal_belly', root, Mx)
    for k, (z, a, r) in enumerate(((0.08, -2.1, 0.035), (0.03, -2.6, 0.03), (0.1, -1.5, 0.03), (0.02, -1.15, 0.025), (0.12, -2.45, 0.025), (0.06, -1.8, 0.022))):
        ob = make_part('spot%d' % k, oval_patch(surf, z, r, a, r * 3.2, rows=4, cols=6, thick=0.014), 'seal_spot', root, Mx, subsurf=1)
        ob['outline'] = 0
    # a big reptile-ish head with a wide grin
    hc, hr = V(0.4, 0, 0.04), (0.2, 0.16, 0.15)
    make_part('head', blob(hc, *hr, seg=22, rows=12), 'seal_body', root, Mx)
    hs = ellipsoid_surf(hc, *hr)
    make_part('muzzle', blob(hc + V(0.14, 0, -0.03), 0.1, 0.1, 0.08, seg=14, rows=8), 'seal_belly', root, Mx)
    make_part('nose', sphere(hc + V(0.24, -0.02, 0.01), 0.03, seg=8, rows=5), 'seal_nose', root, Mx, subsurf=0)
    for side, az, dz in (('r', -0.75, 0.05), ('l', -1.45, 0.06)):
        p, n = hs(hc.z + dz, az)
        eye_one('seal', side, p - n * 0.008, n, root, Mx, P)
    if not P.get('x'):
        # the grin: a dark curve along the jaw with a row of little white teeth
        path = [hc + V(0.23, -0.08, -0.06), hc + V(0.12, -0.14, -0.08), hc + V(-0.04, -0.14, -0.05)]
        make_part('grin', tube(path, 0.02, seg=6), 'seal_mouth', root, Mx, subsurf=1)
        for k in range(4):
            u = 0.15 + 0.22 * k
            p = path[0].lerp(path[1], min(1, u * 2)) if u < 0.5 else path[1].lerp(path[2], (u - 0.5) * 2)
            make_part('tooth%d' % k, cone(p + V(0, -0.01, 0.012), p + V(0, -0.02, -0.03), 0.014, seg=5), 'seal_tooth', root, Mx, subsurf=0)
    else:
        make_part('grin', tube([hc + V(0.18, -0.08, -0.06), hc + V(0.06, -0.12, -0.07)], 0.018, seg=6), 'seal_mouth', root, Mx, subsurf=1)
    # flippers: fore on the near side, tail pair at the back flicking
    make_part('fore', prism([V(0.14, 0, -0.06), V(0.02, 0, -0.26), V(-0.06, 0, -0.24), V(0.04, 0, -0.06)], Y * 0.03), 'seal_flipper', root, Mx @ T((0, -0.14, 0)), subsurf=1)
    TM = Mx @ about(V(-0.44, 0, 0), rot_y(wig))
    for k, (dz, y) in enumerate(((0.07, -0.04), (-0.07, 0.04))):
        make_part('tail%d' % k, prism([V(-0.4, 0, 0.0), V(-0.62, 0, dz * 2.2 + 0.03), V(-0.66, 0, dz * 1.2), V(-0.46, 0, -0.01)], Y * 0.03), 'seal_flipper', root, TM @ T((0, y, 0)), subsurf=1)


# ================================================================ ORCA (leaper)
def build_orca(root, pose, t):
    P = {'er': 0.05, 'skin': 'orca_black', 'lid': 0.1, 'look': Vector((0.6, -0.8, 0.0))}
    flick = 14 * math.sin(TAU * t)
    if pose == 'up':
        Mx = rot_y(-70)
    elif pose == 'down':
        Mx = rot_y(70)
        flick *= 0.5
    else:
        Mx = rot_y(168)
        P['x'] = True
    bc, rad = V(0.0, 0, 0.0), (0.55, 0.2, 0.21)
    make_part('body', blob(bc, *rad, seg=28, rows=14), 'orca_black', root, Mx)
    surf = ellipsoid_surf(bc, *rad)
    # white throat and belly sweeping up behind, the eye patch, a grey saddle behind the fin
    make_part('belly', oval_patch(surf, -0.11, 0.08, -1.45, 1.05, rows=6, cols=16), 'orca_white', root, Mx)
    make_part('flank', oval_patch(surf, -0.02, 0.07, -2.35, 0.32, rows=5, cols=8), 'orca_white', root, Mx)
    make_part('patch', oval_patch(surf, 0.09, 0.045, -0.92, 0.2, rows=5, cols=8, thick=0.016), 'orca_white', root, Mx)
    make_part('saddle', oval_patch(surf, 0.17, 0.035, -1.95, 0.3, rows=4, cols=8, thick=0.014), 'orca_grey', root, Mx)
    eye_one('orca', 'r', V(0.36, -0.13, 0.03), Vector((0.45, -1, 0.1)), root, Mx, P, er=0.05)
    if not P.get('x'):
        path = [V(0.54, -0.04, -0.04), V(0.46, -0.12, -0.07), V(0.36, -0.15, -0.05)]
        make_part('smile', tube(path, 0.018, seg=6), 'orca_mouth', root, Mx, subsurf=1)
    # dorsal fin, pectoral fin, tail flukes
    make_part('dorsal', prism([V(-0.12, 0, 0.18), V(-0.02, 0, 0.5), V(0.06, 0, 0.48), V(0.12, 0, 0.18)], Y * 0.05), 'orca_black', root, Mx, subsurf=1)
    make_part('pec', prism([V(0.24, 0, -0.12), V(0.08, 0, -0.34), V(0.0, 0, -0.3), V(0.12, 0, -0.1)], Y * 0.03), 'orca_black', root, Mx @ T((0, -0.17, 0)), subsurf=1)
    TM = Mx @ about(V(-0.5, 0, 0), rot_y(flick))
    make_part('stock', blob(V(-0.6, 0, 0.0), 0.14, 0.08, 0.08, seg=12, rows=8), 'orca_black', root, TM)
    make_part('flukes', prism([V(-0.66, 0, 0.0), V(-0.84, 0, 0.2), V(-0.9, 0, 0.14), V(-0.8, 0, 0.0), V(-0.9, 0, -0.14), V(-0.84, 0, -0.2)][::-1], Y * 0.04), 'orca_black', root, TM, subsurf=1)


# ================================================================ SNOWBALL (roller)
def snowball_body(root, Mx, c, r, t):
    make_part('ball', sphere(c, r, seg=24, rows=14), 'snowball_snow', root, Mx)
    surf = ellipsoid_surf(c, r, r, r)
    make_part('shade', oval_patch(surf, c.z - r * 0.55, 0.09, 0.0, 1.4), 'snowball_shade', root, Mx)
    # an icy cowlick: three crystal spikes on top
    for k, (dx, h, lean) in enumerate(((-0.08, 0.16, -18), (0.03, 0.22, 4), (0.12, 0.13, 22))):
        base = c + V(dx, -0.02, r - 0.03)
        tip = base + V(math.sin(math.radians(lean)) * h, 0, math.cos(math.radians(lean)) * h)
        make_part('crystal%d' % k, cone(base, tip, 0.05, seg=5), 'snowball_ice', root, Mx, subsurf=0)
        ob = make_part('glint%d' % k, cone(base + V(0, -0.03, 0.02), base + (tip - base) * 0.6 + V(0, -0.03, 0), 0.015, seg=4), 'snowball_ice2', root, Mx, subsurf=0)
        ob['outline'] = 0
    # a few blue ice flecks packed in
    for k, (z, a) in enumerate(((0.55, -2.5), (0.25, -2.9), (0.45, 0.5), (0.15, -0.3))):
        p, n = surf(c.z + r * (z - 0.4), a)
        ob = make_part('fleck%d' % k, sphere(p + n * 0.004, 0.03, seg=6, rows=4), 'snowball_ice', root, Mx, subsurf=0)
        ob['outline'] = 0
    return surf


def build_snowball(root, pose, t):
    P = dict(STD_POSE[pose])
    P.update(er=0.085, skin='snowball_snow')
    bob, lean = walk_bob(pose, P, t)
    r = 0.34
    if pose in ('roll', 'curl'):
        c = V(0, 0, r)
        MR = about(c, rot_y(360 * t if pose == 'roll' else 20))
        surf = snowball_body(root, MR, c, r, t)
        for side, az in (('r', -0.8), ('l', -1.45)):
            p, n = surf(c.z + 0.04, az)
            eye_one('snowball', side, p - n * 0.012, n, root, MR, P)
        return
    c = V(0, 0, r + 0.05)
    Mx = T((0, 0, bob)) @ rot_y(lean) @ diag(P['sx'], P['sx'], P['sz'])
    surf = snowball_body(root, Mx, c, r, t)
    for side, az in (('r', -0.78), ('l', -1.45)):
        p, n = surf(c.z + 0.07, az)
        eye_one('snowball', side, p - n * 0.012, n, root, Mx, P)
    if not P.get('x') and pose != 'flat':
        for k, az in enumerate((-0.55, -1.62)):
            make_part('cheek%d' % k, oval_patch(surf, c.z - 0.06, 0.022, az, 0.09, thick=0.014), 'snowball_cheek', root, Mx)
    JE.open_mouth('snowball', root, Mx, surf, P['mouth'], c.z - 0.1, math.radians(-50), math.radians(-100), scale=0.9)
    biped_legs('snowball', root, Mx, P, t, (0.0, 0.1, 0.07), (0.085, 0.06, 0.04), 0.035, 'snowball_feet')


# ================================================================ ROVER (2 hp walker): the runaway research rover
def build_rover(root, pose, t):
    P = dict(STD_POSE[pose])
    P.update(er=0.075, skin='rover_white')
    spin = 360 * t if pose == 'walk' else 0
    bob = 0.012 * math.sin(TAU * t * 2) if pose == 'walk' else 0.0
    sz = 0.42 if pose == 'flat' else 1.0
    sx = 1.25 if pose == 'flat' else 1.0
    Mx = diag(sx, 1, sz) @ T((0, 0, bob))
    tilt = {'stun': 10, 'ko': -14}.get(pose, 0)
    BM = Mx @ about(V(0, 0, 0.2), rot_y(tilt))
    # two tracks with three wheels each (near side shows the hubs turning)
    for side, y in (('far', 0.2), ('near', -0.2)):
        make_part('track_' + side, superellipsoid(V(0, y, 0.13), 0.36, 0.07, 0.12, e=0.5, seg=20, rows=8), 'rover_track', root, Mx)
        for k, x in enumerate((-0.24, 0.0, 0.24)):
            wc = V(x, y - (0.075 if side == 'near' else -0.075), 0.13)
            if side == 'near':
                make_part('wheel%d' % k, torus(wc, 0.07, 0.022, axis=Y, seg=16, rseg=6), 'rover_wheel', root, Mx, subsurf=0)
                for j in range(3):
                    a = math.radians(spin + 120 * j)
                    make_part('spoke%d_%d' % (k, j), tube([wc, wc + V(0.065 * math.cos(a), 0, 0.065 * math.sin(a))], 0.012, seg=4), 'rover_wheel', root, Mx, subsurf=0)
                make_part('hub%d' % k, sphere(wc + V(0, -0.01, 0), 0.025, seg=8, rows=4), 'rover_hub', root, Mx, subsurf=0)
    # the body: a red chassis with a white top deck and a blue solar panel
    make_part('chassis', superellipsoid(V(0, 0, 0.36), 0.38, 0.26, 0.12, e=0.35, seg=22, rows=10), 'rover_red', root, BM)
    make_part('stripe', box_bm((0.78, 0.535, 0.035)), 'rover_white', root, BM @ T((0, 0, 0.33)), subsurf=0)
    make_part('deck', superellipsoid(V(-0.04, 0, 0.5), 0.32, 0.22, 0.05, e=0.3, seg=20, rows=8), 'rover_white', root, BM)
    make_part('panel', box_bm((0.26, 0.34, 0.025), bevel=0.01), 'rover_panel', root, BM @ T((-0.18, 0, 0.56)) @ rot_y(-12), subsurf=0)
    for k in range(3):
        ob = make_part('pline%d' % k, box_bm((0.008, 0.345, 0.03)), 'rover_grey', root, BM @ T((-0.27 + 0.09 * k, 0, 0.565)) @ rot_y(-12), subsurf=0)
        ob['outline'] = 0
    # the antenna mast with a blinking green lamp
    make_part('mast', tube([V(-0.28, 0.1, 0.52), V(-0.3, 0.1, 0.9)], 0.014, seg=5), 'rover_grey', root, BM, subsurf=0)
    lit = pose == 'walk' and (int(t * 6) % 2 == 0) or pose == 'stun'
    make_part('lamp', sphere(V(-0.3, 0.1, 0.93), 0.045, seg=10, rows=6), 'rover_glow' if lit else 'rover_track', root, BM, subsurf=0)
    # the camera head on a neck: a rounded box with two big lens eyes
    neck0, neck1 = V(0.22, 0, 0.5), V(0.26, 0, 0.66)
    nod = {'walk': 4 * math.sin(TAU * t), 'stun': 18, 'ko': 25, 'flat': 0}.get(pose, 0)
    HM = BM @ about(neck0, rot_y(nod))
    make_part('neck', tube([neck0, neck1], 0.035, seg=8), 'rover_grey', root, HM, subsurf=0)
    hc = V(0.28, 0, 0.75)
    make_part('head', superellipsoid(hc, 0.13, 0.17, 0.1, e=0.35, seg=18, rows=8), 'rover_white', root, HM)
    make_part('visor', superellipsoid(hc + V(0.1, -0.0, 0.0), 0.05, 0.15, 0.075, e=0.35, seg=14, rows=6), 'rover_lens', root, HM, subsurf=0)
    n = Vector((0.55, -0.83, 0.0)).normalized()
    for side, dy, dz in (('r', -0.06, 0.0), ('l', 0.07, 0.005)):
        c = hc + V(0.13, dy, dz)
        eye_one('rover', side, c, n, root, HM, P, er=0.055)
    make_part('dish', lathe([(0.0, 0.0), (0.07, 0.02), (0.09, 0.05)], seg=14), 'rover_grey', root, HM @ T(hc + V(-0.06, 0.06, 0.1)) @ rot_y(-30), subsurf=0)
    # a little grabber arm on the front
    make_part('arm', tube([V(0.36, -0.2, 0.36), V(0.48, -0.22, 0.32), V(0.52, -0.22, 0.22)], 0.018, seg=5), 'rover_grey', root, BM, subsurf=0)
    make_part('claw', sphere(V(0.53, -0.22, 0.2), 0.03, seg=8, rows=5), 'rover_hub', root, BM, subsurf=0)


# ================================================================ COIN: the snowflake
def snowflake(root, Mx, mat, mat2, core, r=0.27, depth=0.05, name='flake'):
    for k in range(6):
        a = TAU * k / 6 + math.pi / 2
        d = V(math.cos(a), 0, math.sin(a))
        s = V(-math.sin(a), 0, math.cos(a))
        arm = [d * 0.04 - s * 0.045, d * r * 0.92 - s * 0.04, d * r, d * r * 0.92 + s * 0.04, d * 0.04 + s * 0.045]
        make_part('%s_arm%d' % (name, k), prism(arm, Y * depth), mat, root, Mx, subsurf=0, smooth=False)
        for sg in (-1, 1):
            b0 = d * r * 0.5
            br = [b0 - d * 0.04, b0 + s * sg * r * 0.36 + d * r * 0.14, b0 + s * sg * r * 0.3 + d * r * 0.22, b0 + d * 0.06]
            if sg < 0:
                br = br[::-1]
            make_part('%s_br%d%d' % (name, k, sg > 0), prism(br, Y * depth * 0.9), mat, root, Mx, subsurf=0, smooth=False)
        ob = make_part('%s_hi%d' % (name, k), prism([d * 0.06 - s * 0.012, d * r * 0.78, d * 0.06 + s * 0.012][::-1], Y * depth * 1.4), mat2, root, Mx, subsurf=0, smooth=False)
        ob['outline'] = 0
    hexa = [V(0.085 * math.cos(TAU * j / 6), 0, 0.085 * math.sin(TAU * j / 6)) for j in range(6)]
    make_part(name + '_core', prism(hexa, Y * depth * 1.6), core, root, Mx, subsurf=0, smooth=False)


def build_coin(root, pose, t):
    Mx = rot_z(360 * t)
    snowflake(root, Mx, 'coin_ice', 'coin_ice2', 'coin_core')
    ob = make_part('shine', ellipsoid(V(-0.03, -0.05, 0.03), X * 0.025, Y * 0.01, Z * 0.025, seg=8, rows=4), 'coin_shine', root, Mx, subsurf=0)
    ob['outline'] = 0


# ================================================================ STAR: the golden penguin
def build_star(root, pose, t):
    Mx = T((0, 0, 0.035 * math.sin(TAU * t))) @ rot_y(5 * math.sin(TAU * t))
    S = Mx @ T((0, 0, -0.33)) @ diag(0.62, 0.62, 0.62)
    make_part('body', lathe(PEN, seg=24), 'star_gold', root, S)
    surf = lathe_surf(PEN)
    make_part('front', oval_patch(surf, 0.36, 0.28, -0.65, 0.9), 'star_gold2', root, S)
    hc = V(0.06, 0, 0.88)
    make_part('head', sphere(hc, 0.21, seg=20, rows=12), 'star_gold', root, S)
    hs = ellipsoid_surf(hc, 0.21, 0.21, 0.21)
    for k, az in enumerate((-0.62, -1.38)):
        p, n = hs(hc.z + 0.04, az)
        make_part('eye%d' % k, sphere(p + n * 0.005, 0.035, seg=8, rows=5), 'star_eye', root, S, subsurf=0)
    make_part('beak', cone(hc + V(0.18, 0, -0.02), hc + V(0.34, 0, -0.04), 0.05, flat=0.8, seg=10), 'star_beak', root, S)
    for side, y, ang in (('far', 0.25, 40), ('near', -0.27, 55)):
        sh = V(0.0, y, 0.6)
        make_part('flip_' + side, ellipsoid(sh + V(0.0, 0, -0.2), X * 0.075, Y * 0.03, Z * 0.21, seg=12, rows=8), 'star_gold', root, S @ about(sh, rot_y(-ang)))
    for k, y in enumerate((-0.11, 0.11)):
        make_part('foot%d' % k, ellipsoid(V(0.1, y, 0.03), X * 0.12, Y * 0.06, Z * 0.035, seg=12, rows=6), 'star_core', root, S, subsurf=1)
    make_part('plinth', lathe([(0.0, -0.06), (0.3, -0.06), (0.32, -0.02), (0.3, 0.02), (0.0, 0.02)], seg=22), 'star_core', root, S)
    for k in range(3):
        a = TAU * (t + k / 3)
        c = V(0.42 * math.cos(a), -0.2, 0.28 * math.sin(a))
        r = 0.05 + 0.015 * math.sin(TAU * t * 2 + k)
        pts = [c + V((r if j % 2 == 0 else r * 0.38) * math.cos(TAU * j / 8), 0, (r if j % 2 == 0 else r * 0.38) * math.sin(TAU * j / 8)) for j in range(8)]
        make_part('sparkle%d' % k, prism(pts, Y * 0.02), 'star_glow', root, Mx, subsurf=0, smooth=False)


# ================================================================ QBLOCK / USED: the ice block
def build_block(root, Mx, spent):
    H = 0.55
    k = 'used' if spent else 'qblock'
    make_part('box', box_bm((2 * H, 2 * H, 2 * H), bevel=0.08, segments=3), k + '_ice', root, Mx, subsurf=0)
    # a frosted rim round every edge (snow packed on the corners)
    fr = k + '_frost'
    for (ax, n) in ((0, 4), (1, 4), (2, 4)):
        for sa in (-1, 1):
            for sb in (-1, 1):
                if ax == 0:
                    at, sz = (0, sa * (H - 0.03), sb * (H - 0.03)), (2 * H - 0.08, 0.1, 0.1)
                elif ax == 1:
                    at, sz = (sa * (H - 0.03), 0, sb * (H - 0.03)), (0.1, 2 * H - 0.08, 0.1)
                else:
                    at, sz = (sa * (H - 0.03), sb * (H - 0.03), 0), (0.1, 0.1, 2 * H - 0.08)
                make_part('rim%d%d%d' % (ax, sa > 0, sb > 0), box_bm(sz, bevel=0.035, segments=2), fr, root, Mx @ T(at), subsurf=0)
    make_part('cap', superellipsoid(V(0, 0, H + 0.02), H - 0.02, H - 0.02, 0.06, e=0.6, seg=20, rows=6), fr, root, Mx, subsurf=0)
    for fi, (nrm, tng) in enumerate((((0, -1, 0), (1, 0, 0)), ((1, 0, 0), (0, 1, 0)))):
        bn, bt = Vector(nrm), Vector(tng)
        bu = bn.cross(bt)
        c = bn * (H + 0.004)
        if not spent:
            # an inner glassy panel and a snowflake frozen into the face
            make_part('pane%d' % fi, box_bm(tuple(abs(v) for v in (bt * 0.78 + bu * 0.78 + bn * 0.01)), bevel=0.0), k + '_ice2', root, Mx @ T(c), subsurf=0)
            FM = Mx @ Matrix.Translation(c + bn * 0.012) @ Matrix(((bt.x, -bn.x, bu.x, 0), (bt.y, -bn.y, bu.y, 0), (bt.z, -bn.z, bu.z, 0), (0, 0, 0, 1)))
            snowflake(root, FM, 'qblock_flake', 'qblock_flake2', 'qblock_flake', r=0.32, depth=0.02, name='fl%d' % fi)
            ob = make_part('gleam%d' % fi, box_bm(tuple(abs(v) + 0.001 for v in (bt * 0.08 + bu * 0.3 + bn * 0.01))), 'qblock_flake2', root, Mx @ T(c + bn * 0.006 - bt * 0.3 + bu * 0.12), subsurf=0)
            ob['outline'] = 0
        else:
            for j, (u0, v0, u1, v1) in enumerate(((-0.3, 0.35, 0.05, -0.05), (0.05, -0.05, 0.3, -0.32), (0.05, -0.05, -0.15, -0.3))):
                p0 = c + bt * u0 + bu * v0 + bn * 0.01
                p1 = c + bt * u1 + bu * v1 + bn * 0.01
                ob = make_part('crack%d_%d' % (fi, j), tube([p0, p0.lerp(p1, 0.5) + bt * 0.03, p1], 0.012, seg=4), 'used_crack', root, Mx, subsurf=0)
                ob['outline'] = 0


def build_qblock(root, pose, t):
    build_block(root, Matrix.Identity(4), False)


def build_used(root, pose, t):
    build_block(root, Matrix.Identity(4), True)


BUILDERS = {'skua': build_skua, 'seal': build_seal, 'snowball': build_snowball, 'rover': build_rover, 'orca': build_orca,
            'skidder': build_skidder, 'penguin': build_penguin, 'coin': build_coin, 'star': build_star,
            'qblock': build_qblock, 'used': build_used}


def build(kind, pose, t=0.0):
    use()
    if kind not in KINDS:
        raise ValueError('unknown kind %r' % kind)
    if pose not in POSES[kind]:
        raise ValueError('unknown pose %r for %s' % (pose, kind))
    M.clear(kind)
    root = new_root(kind, pose)
    BUILDERS[kind](root, pose, t)
    return root
