# Paris 7-1 "Boulangerie Boulevard" (theme fr_morning): the parallax background as a Fiesta Toon diorama, one
# Collection per parallax layer, for the pre-rendered 2D sprite pipeline. Original art: a sunny boulevard of cream
# limestone apartment houses with zinc mansards, striped café awnings and a plain iron lattice tower far away.
#
#   L0  frTower   (base 330, #9aa8c0, dyn:frPigeons, blur)  the lattice tower at 760/1024 of the period, a plain
#                                                            daylight silhouette: curved legs, X braces, two decks,
#                                                            the arch, a spire (the engine draws the pigeons on top)
#   L1  frFacades (base 360, #f0e4cc)                       a continuous row of Haussmann facades: stone, mansard
#                                                            roofs with dormers, chimney pots, tall windows with
#                                                            wrought-iron balconies, flower boxes on the top floor
#   L2  frAwnings (base 380, #c8b8a0)                       boulangerie / café fronts with striped awnings and sign
#                                                            boards, café umbrellas and bistro tables, street lamps
#                                                            and a Morris column in the gaps
#   ground        frCobble: chunky grey cobblestones in lighter mortar under a pale kerb cap, tile-aligned
#
# This module also holds the toolkit shared by the other Paris themes (fr_seine, fr_night, fr_tower, fr_chateau
# import it): the material-prefixing Theme, the lattice tower, the facade row, the four Paris floors (cobble, zinc,
# iron plate, parquet) and the lookkit-based preview renderer. The chunky-part Builder, tiling and the tile-aligned
# floor helpers come from ec_equator.py.
#
# Contract (same as mx_canal.py): every layer stands on its own ground line z = 0, is periodic in x with period P
# (anything crossing x = 0 or x = P is duplicated at x ± P) and stays within y in [-6, 6] (the camera looks along
# +Y from -Y). 1 m = 28.1 px; the player is 1.85 m tall. Materials are plain Principled BSDFs (Base Color only)
# named '<theme>_<role>' so the look kit can restyle them (names containing 'glow' render unlit); every object
# carries obj['sprite_layer']. BASES holds the engine's ground row per layer (px from the top of the 444-px strip).
# Strip-wide slabs overhang the period by OVER (0.6 m) on each side so the toon outline hull never shows at the seam.
#
# Run headless:   /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/sprites/fr_morning.py [--seed N]
# (LOOK=toon is the default preview; LOOK= in the environment renders the plain materials)
import os, sys, math, random
import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)
import ec_equator as K
from ec_equator import Builder, P, TAU, OVER, GP, GROUND_DEPTH, T, CELL_MARGIN, PPM, wraps, cell_rects, tile_span

MODULE = 'fr_morning'
LAYERS = ['L0', 'L1', 'L2']
BASES = {'L0': 330, 'L1': 360, 'L2': 380}
SKY = ['#6aa8e8', '#c8e0ff', '#ffe8e0']
SCRATCH = '/private/tmp/claude-501/-Users-bradymott-brady-o/f5bf6cf3-6fc7-437d-a9b3-6005c5b7ac2b/scratchpad/frbg'
STRIP_H = 444
CAP_H = 0.32                               # the continuous cap band along the top of floor row 0 (9 px)

# =============================================================================================== shared toolkit
class Theme(K.Theme):
    """ec_equator's Theme with the material named '<theme>_<role>' (the palette is keyed by role)."""
    def material(self, role):
        name = f'{self.module}_{role}'
        m = bpy.data.materials.get(name)
        if m is None:
            m = bpy.data.materials.new(name)
            m.use_nodes = True
        bsdf = next((n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
        if bsdf is None:
            bsdf = m.node_tree.nodes.new('ShaderNodeBsdfPrincipled')
            out = next(n for n in m.node_tree.nodes if n.type == 'OUTPUT_MATERIAL')
            m.node_tree.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
        bsdf.inputs['Base Color'].default_value = K.hex_linear(self.PALETTE[role])
        bsdf.inputs['Roughness'].default_value = 0.6
        m.diffuse_color = K.hex_linear(self.PALETTE[role])
        return m

def shade(hexcol, k):
    """Lighten (k > 0) or darken (k < 0) an sRGB hex colour, like the engine's shade()."""
    h = hexcol.lstrip('#')
    out = []
    for i in (0, 2, 4):
        c = int(h[i:i + 2], 16)
        c = c + (255 - c) * k if k > 0 else c * (1 + k)
        out.append(max(0, min(255, int(round(c)))))
    return '#%02x%02x%02x' % tuple(out)

# ---------------------------------------------------------------------------------------------- the iron lattice tower
def lattice_tower(th, L, name, x, h, roles, y=0.0, detail=True):
    """The tower as a plain lattice silhouette: two legs on the painter's quadratic curve, X braces between them,
    the arch under the first deck, two decks, a tapering spire with a small top cabin and an antenna. Never a light
    show. roles: iron, deck."""
    w = 0.36 * h
    B = Builder(name, L, th)
    def leg(t):
        x0, z0, cx, cz, x1, z1 = w / 2, 0.0, 0.18 * w, 0.35 * h, 0.06 * w, 0.78 * h
        return ((1 - t) ** 2 * x0 + 2 * (1 - t) * t * cx + t * t * x1, (1 - t) ** 2 * z0 + 2 * (1 - t) * t * cz + t * t * z1)
    n = 8
    pts = [leg(i / n) for i in range(n + 1)]
    r0, r1 = 0.030 * h, 0.012 * h
    for sx in (-1, 1):
        for i in range(n):
            (xa, za), (xb, zb) = pts[i], pts[i + 1]
            ra, rb = r0 + (r1 - r0) * i / n, r0 + (r1 - r0) * (i + 1) / n
            B.rod(roles['iron'], (x + sx * xa, y, za - 0.3 * (i == 0)), (x + sx * xb, y, zb), ra, segs=6, r2=rb)
            B.sphere(roles['iron'], (x + sx * xb, y, zb), rb, subdiv=0)
        # the spire leg: straight from the top of the curve to just under the cabin
        B.rod(roles['iron'], (x + sx * pts[-1][0], y, pts[-1][1]), (x + sx * 0.018 * w, y, 0.96 * h), r1, segs=6, r2=r1 * 0.8)
    if detail:
        rb = 0.0075 * h
        for i in range(n):
            (xa, za), (xb, zb) = pts[i], pts[i + 1]
            B.rod(roles['iron'], (x - xa, y - 0.02, za), (x + xb, y - 0.02, zb), rb, segs=4)
            B.rod(roles['iron'], (x + xa, y - 0.02, za), (x - xb, y - 0.02, zb), rb, segs=4)
            B.rod(roles['iron'], (x - xa, y + 0.02, za), (x + xa, y + 0.02, za), rb, segs=4)
    # the arch under the first deck, the two decks, the cabin and antenna
    B.band_arch(roles['iron'], (x, y - 0.05, 0.0), 0.30 * w, 0.21 * h, 0.022 * h, 0.1)
    B.box(roles['deck'], (x, y, 0.32 * h), (0.52 * w, 0.5 * w, 0.03 * h), bevel=0.02)
    B.box(roles['deck'], (x, y, 0.60 * h), (0.27 * w, 0.27 * w, 0.025 * h), bevel=0.02)
    B.box(roles['deck'], (x, y, 0.955 * h), (0.09 * w, 0.09 * w, 0.03 * h), bevel=0.01)
    B.rod(roles['iron'], (x, y, 0.965 * h), (x, y, 1.04 * h), 0.006 * h, segs=5, r2=0.003 * h)
    B.done()

# ---------------------------------------------------------------------------------------------- Haussmann facades
GF, FH, RH = 1.4, 0.85, 0.8                # ground-floor height, storey height, mansard height (m)

def building(th, L, name, x0, w, nf, rng, roles, night=False, flowers=True, y=0.0):
    """One Haussmann house with its left edge at x0: a stone body, a cornice, a zinc mansard with dormers and a
    chimney with two pots, tall windows (lit or dark at night) with wrought-iron balconies on alternate floors,
    flower boxes along the top floor by day, a shop band with an arched door at street level."""
    B = Builder(name, L, th)
    top = GF + nf * FH + 0.25
    stone = rng.choice([roles['stone'], roles['stone2'], roles['stone3']])
    B.box(stone, (x0 + w / 2, y + 1.5, (top - 1.0) / 2), (w - 0.06, 3.0, top + 1.0), bevel=0.02)
    B.box(roles['stone_dark'], (x0 + w - 0.06, y - 0.01, (top - 1.0) / 2), (0.1, 0.06, top + 1.0), bevel=0.0)
    B.box(roles['stone_light'], (x0 + w / 2, y + 1.5, top - 0.08), (w + 0.08, 3.1, 0.16), bevel=0.02)
    # mansard roof, its flat top, the dormers and the chimney
    B.slab(roles['roof'], [(x0 - 0.04, top), (x0 + w + 0.04, top), (x0 + w - 0.3, top + RH), (x0 + 0.3, top + RH)], 3.0, at=(0, y, 0))
    B.box(roles['roof_dark'], (x0 + w / 2, y + 1.5, top + RH), (w - 0.6, 2.8, 0.1), bevel=0.02)
    nd = 3 if w > 3.1 else 2
    for k in range(nd):
        dx = x0 + 0.55 + k * (w - 1.1) / (nd - 1)
        B.box(roles['roof'], (dx, y - 0.1, top + 0.3), (0.36, 0.5, 0.46), bevel=0.02)
        B.slab(roles['roof_dark'], [(dx - 0.22, top + 0.52), (dx + 0.22, top + 0.52), (dx, top + 0.7)], 0.5, at=(0, y - 0.12, 0))
        lit = night and rng.random() < 0.6
        B.box(roles['dormer_glow'] if lit else roles['dormer_win'], (dx, y - 0.14, top + 0.3), (0.2, 0.05, 0.28), bevel=0.0)
    cx = x0 + 0.7 * w
    B.box(roles['chimney'], (cx, y + 0.6, top + RH + 0.2), (0.3, 0.3, 0.6), bevel=0.02)
    for px in (-0.08, 0.08):
        B.lathe(roles['pot'], [(0.05, 0.0), (0.05, 0.2)], 6, at=(cx + px, y + 0.6, top + RH + 0.5), cap_top=True)
    # windows, balconies, flower boxes
    n = max(1, int((w - 0.4) / 0.6))
    wx0 = x0 + (w - (n - 1) * 0.6) / 2
    for f in range(nf):
        wz = GF + f * FH + 0.42
        for k in range(n):
            wx = wx0 + k * 0.6
            if night:
                role = roles['win_glow'] if rng.random() < 0.35 else roles['win_dark']
                B.box(role, (wx, y - 0.03, wz), (0.34, 0.08, 0.56), bevel=0.0)
            else:
                B.box(roles['window'], (wx, y - 0.03, wz), (0.34, 0.08, 0.56), bevel=0.0)
                B.box(roles['window_hi'], (wx - 0.1, y - 0.08, wz), (0.08, 0.02, 0.5), bevel=0.0)
            if f % 2 == 0:
                B.box(roles['iron'], (wx, y - 0.1, wz - 0.3), (0.5, 0.22, 0.04), bevel=0.0)
                B.box(roles['iron'], (wx, y - 0.2, wz - 0.03), (0.5, 0.02, 0.025), bevel=0.0)
                for q in range(4):
                    B.rod(roles['iron'], (wx - 0.18 + q * 0.12, y - 0.2, wz - 0.3), (wx - 0.18 + q * 0.12, y - 0.2, wz - 0.03), 0.012, segs=4)
            if f == nf - 1 and flowers and not night and rng.random() < 0.5:
                fr = rng.choice([roles['flower_a'], roles['flower_b'], roles['flower_c']])
                for q in range(3):
                    B.sphere(fr, (wx + (q - 1) * 0.12, y - 0.16, wz - 0.24), 0.075, subdiv=1)
                B.box(roles['leaf'], (wx, y - 0.14, wz - 0.31), (0.4, 0.1, 0.06), bevel=0.0)
    # street level: a shop band, an arched door, two shop windows
    B.box(roles['stone_dark'], (x0 + w / 2, y - 0.02, GF / 2 - 0.5), (w - 0.1, 0.06, GF + 1.0), bevel=0.0)
    B.arch(roles['door'], (x0 + 0.5, y - 0.05, 0.0), 0.6, 1.15, 0.04)
    for sx in (x0 + 1.15 + 0.4, x0 + w - 0.55 - 0.4):
        if sx - 0.45 > x0 + 0.85 and sx + 0.45 < x0 + w - 0.1:
            B.box(roles['shop_win'], (sx, y - 0.05, 0.62), (0.9, 0.04, 0.9), bevel=0.0)
    B.done()

def facade_row(th, L, rng, roles, floors=(4, 5), night=False, flowers=True):
    """A continuous row of houses exactly one period long (the widths are scaled to sum to P), the first one
    starting just left of x = 0 so it straddles the seam and gets tiled."""
    widths = []
    while sum(widths) < P:
        widths.append(rng.uniform(2.5, 3.9))
    s = P / sum(widths)
    widths = [w * s for w in widths]
    x = rng.uniform(-1.0, -0.2)
    for i, w in enumerate(widths):
        building(th, L, f'{L}_house_{i}', x, w, rng.randint(*floors), rng, roles, night=night, flowers=flowers, y=rng.choice([0.0, 0.45]))
        x += w

# ---------------------------------------------------------------------------------------------- the Paris floors
def _backing(th, L, role):
    Builder('ground_backing', L, th).box(role, (GP / 2, 0.5, -GROUND_DEPTH / 2), (GP + 2 * OVER, 1.0, GROUND_DEPTH + 0.6), bevel=0.0).done(period=None)

def _cap(th, L, B, roles):
    B.box(roles['cap'], (GP / 2, 0.1, -0.06 - CAP_H / 2), (GP + 2 * OVER, 0.9, CAP_H), bevel=0.0)
    B.box(roles['cap_hi'], (GP / 2, 0.08, -0.09), (GP + 2 * OVER, 0.95, 0.07), bevel=0.0)

def cobble_ground(th, rng, roles):
    """frCobble: two rows of two rounded cobbles per 32-px tile, three greys, in lighter mortar, under a pale kerb
    cap. roles: mortar, cap, cap_hi, stone_a, stone_b, stone_c."""
    L = th.GROUND
    c = th.new_collection(L)
    _backing(th, L, roles['mortar'])
    B = Builder('ground_cobbles', L, th)
    stones = [roles['stone_a'], roles['stone_b'], roles['stone_c']]
    for col in range(8):
        for row in range(3):
            for xc, zc, w, h in cell_rects(col, row, rng, rows=(2,), cols=(2,), gap=0.1, top=(CAP_H if row == 0 else 0.0), jitter=0.18):
                B.rbox(rng.choice(stones), (xc, -0.08, zc), (w * rng.uniform(0.9, 1.0), 0.4, h * rng.uniform(0.88, 1.0)), bevel=0.11, segments=2,
                       rot=(0, rng.uniform(-0.04, 0.04), 0))
    B.done(period=None)
    B = Builder('ground_cap', L, th)
    _cap(th, L, B, roles)
    B.done(period=None)
    return c

def zinc_ground(th, rng, roles):
    """frZinc: standing-seam zinc roofing: two panels per row, two rows per tile (the seams are the panel edges), a
    pale highlight strip down each panel, a zinc ridge cap along the top. roles: dark, cap, cap_hi, zinc_a, zinc_b, zinc_hi."""
    L = th.GROUND
    c = th.new_collection(L)
    _backing(th, L, roles['dark'])
    B = Builder('ground_panels', L, th)
    for col in range(8):
        for row in range(3):
            for i, (xc, zc, w, h) in enumerate(cell_rects(col, row, rng, rows=(2,), cols=(2,), gap=0.07, top=(CAP_H if row == 0 else 0.0), jitter=0.0)):
                role = roles['zinc_a'] if (i + row + col) % 2 == 0 else roles['zinc_b']
                B.box(role, (xc, -0.05, zc), (w, 0.3, h), bevel=0.03)
                B.box(roles['zinc_hi'], (xc - w / 2 + 0.07, -0.21, zc), (0.045, 0.02, h - 0.08), bevel=0.0)
    B.done(period=None)
    B = Builder('ground_cap', L, th)
    _cap(th, L, B, roles)
    B.done(period=None)
    return c

def iron_ground(th, rng, roles):
    """metal (the engine's 'metal' style in the tower's iron palette): riveted iron plates, one per row and two rows
    per tile, under a brown safety band with black chevrons (each chevron inside its tile) and a bright top line.
    roles: dark, cap, cap_hi, chevron, plate_a, plate_b, rivet."""
    L = th.GROUND
    c = th.new_collection(L)
    _backing(th, L, roles['dark'])
    B = Builder('ground_plates', L, th)
    for col in range(8):
        for row in range(3):
            for i, (xc, zc, w, h) in enumerate(cell_rects(col, row, rng, rows=(2,), cols=(1,), gap=0.08, top=(CAP_H if row == 0 else 0.0), jitter=0.0)):
                B.box(roles['plate_a'] if (i + row + col) % 2 == 0 else roles['plate_b'], (xc, -0.05, zc), (w, 0.3, h), bevel=0.04)
                for sx in (-1, 1):
                    for sz in (-1, 1):
                        B.sphere(roles['rivet'], (xc + sx * (w / 2 - 0.11), -0.2, zc + sz * (h / 2 - 0.1)), 0.04, subdiv=1)
    B.done(period=None)
    B = Builder('ground_cap', L, th)
    _cap(th, L, B, roles)
    for col in range(8):
        x0, x1 = tile_span(col, 0.1)
        for k in range(3):
            cx = x0 + (k + 0.5) * (x1 - x0) / 3
            B.box(roles['chevron'], (cx, -0.02, -0.06 - CAP_H / 2 - 0.02), (0.11, 0.06, 0.26), bevel=0.0, rot=(0, 0.5, 0))
    B.done(period=None)
    return c

def parquet_ground(th, rng, roles):
    """frParquet: oak boards two per row and two rows per tile with the joints staggered row to row, a varnish gloss
    line along the top of every board, dark joints, a lighter oak cap. roles: joint, cap, cap_hi, board_a, board_b, board_c, gloss."""
    L = th.GROUND
    c = th.new_collection(L)
    _backing(th, L, roles['joint'])
    B = Builder('ground_boards', L, th)
    boards = [roles['board_a'], roles['board_b'], roles['board_c']]
    for col in range(8):
        for row in range(3):
            for xc, zc, w, h in cell_rects(col, row, rng, rows=(2,), cols=(2,), gap=0.06, top=(CAP_H if row == 0 else 0.0), jitter=0.4):
                B.box(rng.choice(boards), (xc, -0.05, zc), (w, 0.3, h), bevel=0.02)
                B.box(roles['gloss'], (xc, -0.21, zc + h / 2 - 0.05), (w - 0.06, 0.02, 0.035), bevel=0.0)
    B.done(period=None)
    B = Builder('ground_cap', L, th)
    _cap(th, L, B, roles)
    B.done(period=None)
    return c

# ---------------------------------------------------------------------------------------------- preview renderer
def preview(th, build, build_ground, argv=None):
    """Main-guard body shared by the Paris themes: build, apply the look (toon by default, like build_country.sh),
    render every layer the way render_country.py does, a composite over the sky, seam checks, the floor strip and a
    shuffled-tile floor preview into the scratch folder; save the .blend."""
    import lookkit as LK
    seed = 1
    argv = sys.argv if argv is None else argv
    for i, a in enumerate(argv):
        if a == '--seed' and i + 1 < len(argv):
            seed = int(argv[i + 1])
    look = os.environ.get('LOOK', 'toon')
    os.makedirs(SCRATCH, exist_ok=True)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    cols = build(seed)
    print('triangles:', th.triangle_count(), {l: th.triangle_count([l]) for l in th.LAYERS})
    LK.setup_render('BLENDER_EEVEE', samples=24)
    objs = [o for c in cols.values() for o in c.all_objects]
    if look:
        LK.apply_look(look, objs, outline_px=0.9)
    LK.lights(look or 'toon', key_dir=(0.35, -0.75, 0.9))
    tag = f'_{look}' if look else ''
    paths = {}
    h_m = STRIP_H / PPM
    for L in th.LAYERS:
        for other in th.LAYERS:
            cols[other].hide_render = other != L
        z_top = th.BASES[L] / PPM
        LK.ortho_camera(P / 2, z_top - h_m / 2, P, h_m, 1024, STRIP_H)
        paths[L] = LK.render(os.path.join(SCRATCH, f'{th.module}_{L}{tag}.png'))
        print('rendered', paths[L])
    comp = os.path.join(SCRATCH, f'{th.module}_composite{tag}.png')
    K.composite(th, paths, comp)
    print('composite', comp)
    for L in th.LAYERS:
        K.seam_check(paths[L], os.path.join(SCRATCH, f'{th.module}_{L}_seam{tag}.png'))
    for other in th.LAYERS:
        cols[other].hide_render = True
    gcol = build_ground(seed)
    print('ground triangles:', th.triangle_count([th.GROUND]))
    if look:
        LK.apply_look(look, list(gcol.all_objects), outline_px=0.9)
    GH = GROUND_DEPTH
    LK.ortho_camera(GP / 2, -GH / 2, GP, GH, 512, 192)
    gp = LK.render(os.path.join(SCRATCH, f'{th.module}_ground{tag}.png'))
    K.shuffled_ground(gp, os.path.join(SCRATCH, f'{th.module}_ground_shuffled{tag}.png'), random.Random(seed + 7))
    print('ground', gp)
    for c in th.COLL.values():
        c.hide_render = False
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(SCRATCH, f'{th.module}{tag}.blend'))

# =============================================================================================== fr_morning
PALETTE = {
    # L0 the tower (#9aa8c0)
    'iron': '#9aa8c0', 'deck': '#a6b2c8',
    # L1 facades (#f0e4cc), roofs #7a8aa0
    'stone': '#f0e4cc', 'stone2': '#f6ecd8', 'stone3': '#e9dcc2', 'stone_light': '#faf4e6', 'stone_dark': '#d4c6ac',
    'roof': '#7a8aa0', 'roof_dark': '#6a7890', 'window': '#4a5a78', 'window_hi': '#aab6cc', 'dormer_win': '#b8c8e0', 'dormer_glow': '#ffd890',
    'win_glow': '#ffd890', 'win_dark': '#1a2034', 'chimney': '#a86a4a', 'pot': '#c87a5a', 'balcony': '#2a2a34', 'door': '#5a4636', 'shop_win': '#6a7a98',
    'flower_a': '#ff6a8a', 'flower_b': '#ffd84a', 'flower_c': '#ff9a3a', 'leaf': '#3a8a3a',
    # L2 awnings (#c8b8a0)
    'shop': '#aa9c88', 'shop_dark': '#8e8270', 'cream': '#fff4e8', 'red': '#c8283a', 'blue': '#2a6ac8', 'green': '#2a8a5a', 'orange': '#c87a2a',
    'wood': '#3a2a2a', 'lamp_iron': '#2a3a30', 'lamp_glass': '#f4ecd0', 'gold': '#d8a848', 'column': '#2a4a3a', 'poster': '#f4e8d0',
    # ground (frCobble)
    'g_mortar': '#a0a0ae', 'g_cap': '#c8ccd8', 'g_cap_hi': '#eef0f8', 'g_stone_a': '#8e94a6', 'g_stone_b': '#7e8496', 'g_stone_c': '#9aa0b2',
}
TH = Theme(MODULE, LAYERS, BASES, PALETTE, SKY)
FACADE_ROLES = {k: k for k in ('stone', 'stone2', 'stone3', 'stone_light', 'stone_dark', 'roof', 'roof_dark', 'window', 'window_hi', 'dormer_win',
                               'dormer_glow', 'win_glow', 'win_dark', 'chimney', 'pot', 'door', 'shop_win', 'flower_a', 'flower_b', 'flower_c', 'leaf')}
FACADE_ROLES['iron'] = 'balcony'

def build_L0(rng):
    lattice_tower(TH, 'L0', 'L0_tower', P * 760 / 1024, 240 / PPM, {'iron': 'iron', 'deck': 'deck'}, y=2.0)

def build_L1(rng):
    facade_row(TH, 'L1', rng, FACADE_ROLES, floors=(4, 5))

def awning(B, x0, w, colour, rng):
    """A striped awning over a shop front: six alternating wedges sloping out from the wall at z 2.95 to z 2.55,
    a valance along the outer edge."""
    th = math.atan2(0.42, 0.78)
    for k in range(6):
        xs = x0 + (k + 0.5) * w / 6
        role = colour if k % 2 == 0 else 'cream'
        B.box(role, (xs, -0.39, 2.76), (w / 6 + 0.01, 0.9, 0.05), bevel=0.0, rot=(th, 0, 0))
        B.box(role, (xs, -0.79, 2.48), (w / 6 + 0.01, 0.04, 0.16), bevel=0.0)

def shop_front(th, L, name, x0, w, colour, rng):
    """A boulangerie / café front: a tan wall, a coloured fascia with a cream oval sign, the striped awning, a
    bistro table and chairs in front and, for some, a café umbrella."""
    B = Builder(name, L, th)
    B.box('shop', (x0 + w / 2, 0.6, 0.8), (w, 1.2, 5.6), bevel=0.02)
    B.box('shop_dark', (x0 + w / 2, 0.02, 3.72), (w, 0.1, 0.12), bevel=0.0)
    B.box(colour, (x0 + w / 2, -0.03, 3.3), (w - 0.1, 0.12, 0.5), bevel=0.01)
    B.sphere('cream', (x0 + w / 2, -0.12, 3.3), 0.16, scale=(2.4, 0.3, 1.0), subdiv=1)
    for sx in (x0 + 0.25, x0 + w - 0.25):
        B.box('gold', (sx, -0.1, 3.3), (0.12, 0.04, 0.3), bevel=0.0)
    awning(B, x0, w, colour, rng)
    # a big shop window with a cream frame and a door
    B.box('cream', (x0 + w * 0.6, -0.02, 1.4), (w * 0.62, 0.06, 2.0), bevel=0.0)
    B.box('shop_win', (x0 + w * 0.6, -0.05, 1.4), (w * 0.62 - 0.16, 0.04, 1.84), bevel=0.0)
    B.box('wood', (x0 + 0.55, -0.03, 1.1), (0.7, 0.06, 2.2), bevel=0.0)
    B.box('cream', (x0 + 0.55, -0.06, 1.5), (0.44, 0.03, 0.9), bevel=0.0)
    # bistro table and two chairs on the pavement
    tx = x0 + w * 0.5
    B.lathe('wood', [(0.3, 0.68), (0.3, 0.74)], 10, at=(tx, -1.3, 0), cap_top=True, cap_bottom=True)
    B.rod('wood', (tx, -1.3, 0.0), (tx, -1.3, 0.68), 0.03, segs=5)
    for sx in (-0.62, 0.62):
        B.box('wood', (tx + sx, -1.3, 0.44), (0.36, 0.36, 0.05), bevel=0.0)
        B.box('wood', (tx + sx - 0.17 * (1 if sx < 0 else -1), -1.3, 0.72), (0.05, 0.36, 0.6), bevel=0.0)
        B.rod('wood', (tx + sx, -1.3, 0.0), (tx + sx, -1.3, 0.44), 0.025, segs=4)
    if rng.random() < 0.6:
        ux = x0 + w * rng.choice([0.25, 0.75])
        B.rod('lamp_iron', (ux, -1.6, 0.0), (ux, -1.6, 2.5), 0.03, segs=5)
        B.lathe(colour, [(1.0, 0.0), (0.58, 0.2), (0.0, 0.42)], 8, at=(ux, -1.6, 2.1), cap_bottom=True, phase=rng.uniform(0, TAU))
        B.sphere('cream', (ux, -1.6, 2.55), 0.06, subdiv=0)
    B.done()

def street_lamp(th, L, name, x, rng):
    """A Paris lantern on a dark green post."""
    B = Builder(name, L, th)
    B.lathe('lamp_iron', [(0.22, 0.0), (0.16, 0.12), (0.1, 0.4)], 8, at=(x, -0.6, 0), cap_top=True)
    B.rod('lamp_iron', (x, -0.6, 0.3), (x, -0.6, 3.4), 0.05, segs=6, r2=0.035)
    B.lathe('lamp_iron', [(0.14, 0.0), (0.2, 0.12)], 6, at=(x, -0.6, 3.38), cap_top=True)
    B.box('lamp_glass', (x, -0.6, 3.72), (0.3, 0.3, 0.44), bevel=0.01)
    B.lathe('lamp_iron', [(0.26, 0.0), (0.05, 0.22)], 4, at=(x, -0.6, 3.94), phase=math.pi / 4, cap_bottom=True)
    B.sphere('lamp_iron', (x, -0.6, 4.2), 0.06, subdiv=0)
    B.done()

def morris_column(th, L, name, x, rng):
    """A round advertising column: a dark green drum with a cream poster band, a domed cap and a finial."""
    B = Builder(name, L, th)
    B.lathe('column', [(0.62, 0.0), (0.62, 0.25), (0.55, 0.3), (0.55, 2.9), (0.64, 2.95), (0.64, 3.1)], 12, at=(x, -0.4, 0), cap_top=True)
    B.lathe('poster', [(0.58, 1.0), (0.58, 2.6)], 12, at=(x, -0.4, 0), cap_top=False)
    for k, (dx, role) in enumerate(((-0.3, 'red'), (0.3, 'blue'))):
        B.box(role, (x + dx, -0.98, 1.8), (0.26, 0.02, 1.0), bevel=0.0)
    B.lathe('column', [(0.66, 0.0), (0.5, 0.3), (0.25, 0.55), (0.0, 0.68)], 12, at=(x, -0.4, 3.1), cap_bottom=True, smooth=True)
    B.rod('column', (x, -0.4, 3.7), (x, -0.4, 4.1), 0.04, segs=5)
    B.sphere('gold', (x, -0.4, 4.15), 0.09, subdiv=1)
    B.done()

def build_L2(rng):
    L = 'L2'
    colours = ['red', 'blue', 'green', 'orange']
    rng.shuffle(colours)
    x0 = rng.uniform(0.3, 0.9)
    x, i = x0, 0
    furniture = ['lamp', 'column', 'lamp', 'lamp', 'none']
    while True:
        w = rng.uniform(2.3, 3.9)
        if x + w > P + x0 - 0.9:
            break
        shop_front(TH, L, f'{L}_shop_{i}', x, w, colours[i % 4], rng)
        gap = rng.uniform(0.9, 1.6)
        f = furniture[i % len(furniture)]
        if f == 'lamp':
            street_lamp(TH, L, f'{L}_lamp_{i}', x + w + gap / 2, rng)
        elif f == 'column':
            morris_column(TH, L, f'{L}_column_{i}', x + w + gap / 2 + 0.2, rng)
        x += w + gap
        i += 1
    # the gap that closes the loop gets a lamp too
    street_lamp(TH, L, f'{L}_lamp_end', (x + P + x0) / 2 % P, rng)

def build(seed=1):
    """Build every parallax layer (clears first; deterministic for a seed). Returns {layer: Collection}."""
    clear()
    for name in LAYERS:
        TH.new_collection(name)
    rng = random.Random(seed)
    build_L0(random.Random(rng.random()))
    build_L1(random.Random(rng.random()))
    build_L2(random.Random(rng.random()))
    return {name: TH.COLL[name] for name in LAYERS}

def build_ground(seed=1):
    """frCobble floor, tile-aligned, period GP; its own collection 'ground'."""
    return cobble_ground(TH, random.Random(seed), {'mortar': 'g_mortar', 'cap': 'g_cap', 'cap_hi': 'g_cap_hi', 'stone_a': 'g_stone_a', 'stone_b': 'g_stone_b', 'stone_c': 'g_stone_c'})

def clear():
    TH.clear()

if __name__ == '__main__':
    preview(TH, build, build_ground)
