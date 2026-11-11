# aq_kit: shared Antarctic shapes for the Antarctica theme modules (aq_shelf, aq_sea, aq_station, aq_storm, aq_aurora).
# Built on jp_kit (Builder, tiling, ridges, floors); a theme calls jp_kit.use(MODULE, PALETTE, LAYERS) first and then
# these helpers with role names from its own PALETTE. Not a theme itself (no LAYERS), so build_country.sh skips it.
# Background rules kept here: icebergs are never flat-topped "platforms" (tilted, peaked, domed or arched tops, misty
# feet in the sea), the shelf crest rolls, far things are unlined and paler than the floor.
import math, random
import jp_kit as K
from jp_kit import P, Builder, plain, ridge_slab, periodic_profile, wraps, TAU, T as TILE, CELL_MARGIN
import np_hills as NH


def far_peaks(L, rng, far=('rock_far', 'snow_far'), near=('rock', 'snow'), near_outline=0.0, hf=(4.0, 6.4), hn=(2.8, 4.8)):
    """The Transantarctic-style wall: two rows of faceted peaks under big snow caps (far row unlined)."""
    pl = plain(L, L + '_plain', 'base_far', y=6.0, depth=3.0, top=0.0, bottom=-3.0)
    pl['outline'] = 0
    NH.peaks(L, rng, 0, hf[0], hf[1], 3.8, 5.4, far[0], far[1], 4.0, outline=0.0, snow_from=0.42, name='far')
    NH.peaks(L, rng, 0, hn[0], hn[1], 3.0, 4.6, near[0], near[1], 2.0, outline=near_outline, snow_from=0.5, name='near')


def _berg_outline(kind, w, h, rng):
    """(x, z) outline of a berg above the waterline (counter-clockwise from the bottom left), never a flat table;
    its flanks lean in toward the top."""
    pts = _berg_raw(kind, w, h, rng)
    return [(x * (1 - 0.28 * max(0.0, z) / h), z) for x, z in pts]


def _berg_raw(kind, w, h, rng):
    if kind == 'pinnacle':
        return [(-w / 2, 0.0), (w / 2, 0.0), (w * 0.42, h * 0.45), (w * 0.22, h * 0.62), (w * 0.1, h * 1.0), (-w * 0.06, h * 0.7),
                (-w * 0.2, h * 0.82), (-w * 0.34, h * 0.4), (-w * 0.46, h * 0.22)]
    if kind == 'dome':
        pts = [(-w / 2, 0.0), (w / 2, 0.0)]
        for i in range(1, 12):
            a = math.pi * i / 12
            pts.append((w / 2 * math.cos(a), h * math.sin(a) ** 0.8 * (1 + 0.06 * math.sin(i * 2.1))))
        return pts
    if kind == 'tilt':
        return [(-w / 2, 0.0), (w / 2, 0.0), (w * 0.48, h * 0.35), (w * 0.4, h * 0.62), (w * 0.12, h * 0.78), (-w * 0.05, h * 0.92),
                (-w * 0.22, h * 1.0), (-w * 0.4, h * 0.9), (-w * 0.5, h * 0.5)]
    # 'castle': a weathered berg with two towers and a notch
    return [(-w / 2, 0.0), (w / 2, 0.0), (w * 0.47, h * 0.62), (w * 0.36, h * 1.0), (w * 0.2, h * 0.9), (w * 0.12, h * 0.6),
            (-w * 0.02, h * 0.66), (-w * 0.12, h * 0.85), (-w * 0.26, h * 0.92), (-w * 0.4, h * 0.7), (-w * 0.5, h * 0.4)]


def bergs(L, rng, y=1.6, n=5, wr=(2.6, 5.0), hr=(1.4, 2.8), roles=('berg', 'berg2'), top='berg_top', shade='berg_sh',
          streak='berg_streak', under='berg_under', outline=0.6, kinds=('pinnacle', 'dome', 'tilt', 'castle')):
    """A row of icebergs sitting on the sea line z = 0, each with a lit cap, a shadowed right flank, a few melt streaks
    and a pale ghost of its submerged foot below the waterline."""
    B = Builder(L + '_bergs', L)
    S = Builder(L + '_bergs_shade', L)
    U = Builder(L + '_bergs_under', L)
    x = rng.uniform(0.5, 3.0)
    k = 0
    while x < P - 1.0:
        w, h = rng.uniform(*wr), rng.uniform(*hr)
        if rng.random() < 0.3:
            w, h = rng.uniform(1.0, 1.8), rng.uniform(0.5, 0.9)       # a little growler
        elif rng.random() < 0.3:
            w, h = w * 1.3, h * 1.25                                   # a big one
        kind = rng.choice(kinds)
        pts = _berg_outline(kind, w, h, rng)
        role = roles[k % len(roles)]
        yy = y + rng.uniform(-0.3, 0.3)
        for dx in wraps(x, w / 2 + 0.2):
            B.slab(role, pts, 0.6, at=(x + dx, yy, 0.0))
            # the sunlit top: the outline's upper edge, offset down a little, as a thin front slab
            up = [p for p in pts[2:]]
            cap = [(px, pz) for px, pz in up] + [(px, pz - 0.22 - 0.1 * (i % 2)) for i, (px, pz) in enumerate(reversed(up))]
            S.slab(top, cap[::-1] if False else cap, 0.02, at=(x + dx, yy - 0.04, 0.0))
            # the shadowed right flank
            sh = [(w * 0.18, 0.0), (w / 2, 0.0)] + [(px, pz) for px, pz in up if px > w * 0.18][:3] + [(w * 0.2, h * 0.3)]
            if len(sh) >= 3:
                S.slab(shade, sh, 0.02, at=(x + dx, yy - 0.05, 0.0))
            for j in range(rng.randrange(2, 4)):
                sx = rng.uniform(-w * 0.35, w * 0.1)
                S.slab(streak, [(sx, 0.05), (sx + 0.08, 0.05), (sx + 0.06, h * rng.uniform(0.25, 0.45)), (sx + 0.02, h * rng.uniform(0.25, 0.45))], 0.02, at=(x + dx, yy - 0.06, 0.0))
            # the submerged foot, seen through the water
            U.slab(under, [(-w * 0.3, -min(1.0, h * 0.5)), (w * 0.35, -min(0.9, h * 0.45)), (w * 0.48, -0.02), (-w * 0.46, -0.02)], 0.02, at=(x + dx, yy - 0.06, 0.0))
        x += w * 0.5 + rng.uniform(1.2, 5.5) + (w * 0.5 if rng.random() < 0.7 else 0.0)
        k += 1
    ob = B.done(period=None)
    ob['outline'] = outline
    for b in (S, U):
        o = b.done(period=None)
        o['outline'] = 0
    return ob


def sea(L, rng, y=2.4, role='sea', hi='sea_hi', glint='sea_glint', depth=4.0, glints=18):
    """The polar sea from the waterline down: a dark slab, a lighter band along the top and a few glints."""
    plain(L, L + '_sea', role, y=y, depth=1.0, top=0.0, bottom=-depth)
    B = Builder(L + '_sea_hi', L)
    B.box(hi, (P / 2, y - 0.6, -0.08), (P + 2.0, 0.1, 0.16), bevel=0.0)
    for k in range(glints):
        x = (k + rng.uniform(0.1, 0.9)) * P / glints
        z = -rng.uniform(0.3, 2.2)
        w = rng.uniform(0.5, 1.4)
        for dx in wraps(x, w):
            B.box(glint, (x + dx, y - 0.7, z), (w, 0.05, 0.05), bevel=0.0)
    ob = B.done(period=None)
    ob['outline'] = 0


def shelf(L, rng, y=1.2, base=1.3, amp=0.5, face='shelf', face2='shelf2', crest='shelf_top', cut='shelf_cut',
          streak='shelf_streak', cornice='shelf_snow', outline=0.8, bottom=-4.0, penguins=None):
    """The ice shelf: an ice cliff broken into blocks of different heights (tilted tops, deep V-shaped crevasse notches
    between them, so its crest never reads as one long walkable line), each under a lumpy snow cornice, with tall
    face panels in two blues and melt streaks. Returns the crest height function."""
    # segment the period into blocks
    xs = [0.0]
    while xs[-1] < P - 2.0:
        xs.append(xs[-1] + rng.uniform(2.4, 5.0))
    xs[-1] = P
    tops = []
    for a, b in zip(xs, xs[1:]):
        h0 = base + rng.uniform(-amp, amp)
        tops.append((a, b, h0, h0 + rng.uniform(-0.35, 0.35)))
    def zf(x):
        x = x % P
        for a, b, h0, h1 in tops:
            if a <= x <= b:
                u = (x - a) / (b - a)
                z = h0 + (h1 - h0) * u
                notch = min(u, 1 - u) * (b - a)
                if notch < 0.45:
                    z -= (0.45 - notch) / 0.45 * 0.9
                return z
        return base
    ob = ridge_slab(L, L + '_shelf', face, zf, y=y, depth=1.0, bottom=bottom, step=0.12, outline=outline)
    S = Builder(L + '_shelf_detail', L)
    for j, (a, b, h0, h1) in enumerate(tops):
        if j % 2:
            pts = [(a + 0.45, bottom), (b - 0.45, bottom), (b - 0.45, zf(b - 0.45) - 0.4), (a + 0.45, zf(a + 0.45) - 0.4)]
            S.slab(face2, pts, 0.02, at=(0, y - 0.03, 0))
    for k in range(20):
        sx = rng.uniform(0, P)
        top_ = zf(sx) - rng.uniform(0.35, 0.6)
        S.slab(streak, [(sx, top_ - rng.uniform(1.0, 2.6)), (sx + 0.07, top_ - 1.2), (sx + 0.09, top_), (sx + 0.02, top_)], 0.02, at=(0, y - 0.05, 0))
    for a, b, h0, h1 in tops:
        for dx in wraps(b, 0.5):
            S.slab(cut, [(b + dx - 0.04, zf(b) - 2.2), (b + dx + 0.04, zf(b) - 2.2), (b + dx + 0.3, zf(b + 0.3) - 0.2), (b + dx - 0.3, zf(b - 0.3) - 0.2)], 0.02, at=(0, y - 0.06, 0))
    so = S.done(period=None)
    so['outline'] = 0
    C = Builder(L + '_cornice', L)
    for a, b, h0, h1 in tops:
        x = a + 0.55
        while x < b - 0.5:
            r = rng.uniform(0.3, 0.5)
            for dx in wraps(x, r * 1.5):
                C.sphere(cornice, (x + dx, y - 0.1, zf(x) - 0.04), r, scale=(1.4, 0.6, 0.42), subdiv=2)
            x += r * rng.uniform(1.5, 2.1)
    co = C.done(period=None)
    co['outline'] = outline * 0.6
    return zf


def pressure_ridge(L, rng, y=1.2, base=0.55, amp=0.35, snow='drift', snow_sh='drift_sh', ice=('serac', 'serac2'),
                   facet='serac_hi', outline=0.8, n=7, hr=(0.9, 2.2)):
    """The shelf's pressure ridge: wind-carved snow drifts with clusters of tilted, pointed blue ice shards (seracs)
    pushed up through them. Nothing here has a flat top, so it never reads as a walkable ledge behind the platforms."""
    zf = periodic_profile(rng, base, amp, waves=((3, 1.0), (5, 0.5), (11, 0.15)))
    B = Builder(L + '_seracs', L)
    F = Builder(L + '_seracs_hi', L)
    for k in range(n):
        cx = (k + rng.uniform(0.15, 0.85)) * P / n
        for j in range(rng.randrange(2, 5)):
            x = cx + rng.uniform(-1.2, 1.2)
            w, h = rng.uniform(0.6, 1.3), rng.uniform(*hr) * (1.0 if j == 0 else rng.uniform(0.45, 0.8))
            tilt = rng.uniform(-0.35, 0.35)
            pts = [(-w / 2, -0.6), (w / 2, -0.6), (w * 0.42, h * 0.55), (w * rng.uniform(-0.1, 0.25), h), (-w * 0.42, h * 0.62)]
            hi = [(-w * 0.1, -0.5), (w * 0.4, -0.5), (w * 0.34, h * 0.5), (pts[3][0] * 0.9, h * 0.92)]
            role = ice[(k + j) % len(ice)]
            yy = y + 0.25 + rng.uniform(0.0, 0.5)
            for dx in wraps(x, w):
                B.slab(role, pts, 0.5, at=(x + dx, yy, zf(x) - 0.1), rot=(0, tilt, 0))
                F.slab(facet, hi, 0.02, at=(x + dx, yy - 0.03, zf(x) - 0.1), rot=(0, tilt, 0))
    ob = B.done(period=None)
    ob['outline'] = outline
    of = F.done(period=None)
    of['outline'] = 0
    ridge_slab(L, L + '_drift', snow, zf, y=y, depth=1.0, bottom=-4.0, shade=snow_sh, shade_depth=1.0, outline=outline)
    return zf


def icicle_cap(roles=('g_lip', 'g_icicle')):
    """cap_deco for ground_blocks: two soft snow lumps per tile and small icicles hanging under the cap, all inside the
    tile (the engine draws the floor one tile at a time in any order)."""
    def deco(B, rng, x0, x1):
        for k in range(2):
            xc = x0 + (k + 0.5) * (x1 - x0) / 2
            B.sphere(roles[0], (xc, -0.02, -0.3), 0.2, scale=(1.3, 1.0, 0.45), subdiv=2)
        for k in range(rng.randrange(1, 3)):
            xc = x0 + rng.uniform(0.15, (x1 - x0) - 0.15)
            h = rng.uniform(0.14, 0.24)
            B.lathe(roles[1], [(0.06, 0.0), (0.0, -h)], 5, at=(xc, -0.4, -0.34), cap_top=True)
    return deco


def snow_ground(seed=1, roles=('g_rock', 'g_rock2', 'g_rock3')):
    return K.ground_blocks(seed, cap_h=0.3, rows=(1, 1, 2), cols=(1, 1, 2), gap=0.1, jitter=0.3, roles=roles, rounded=True,
                           cap_deco=icicle_cap(), hi_h=0.08)
