# Brazil 3-5 "Carnival Warehouse": the parallax background as a low-poly Fiesta Toon diorama, one Collection per
# parallax layer, for the pre-rendered 2D sprite pipeline. Original art: the float workshop (barracão), its tiered
# racks stacked with float parts under hanging work lamps.
#
#   L0  brStands  the shared grandstand builder (br_samba.stands) in 'props' mode: eight stepped racks in dark
#                 purple holding drums, rolls of fabric, feather fans, sun ornaments, crates and masks on stands,
#                 steel posts between the racks, work lamps hanging from above, a dark wall below the ground line
#   ground        metal: a grey cap with dark hazard chevrons (four per 32-px tile) over bolted steel plates
#
# Shares the kit of br_beach; same contract.
#
# Run headless:   /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/sprites/br_barracao.py
import os, sys, math, random
import bpy
from mathutils import Vector
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import br_beach as K
import br_samba
from br_beach import Builder, wraps, cell_rects, new_collection, P, GP, GROUND_DEPTH, GROUND_COLL, T, PX, TAU

MODULE = 'br_barracao'
LAYERS = ['L0']                            # brStands (the racks of floats)
BASES = {'L0': 345}
SKY = ['#1a1030', '#2a1a48', '#4a2a5a']

PALETTE = {
    'barracao_wall': '#221430', 'barracao_tread': '#4a3a5e', 'barracao_skin': '#f4ead8', 'barracao_crate': '#8a6a4a', 'barracao_post': '#5a4a6a',
    'barracao_lamp_glow': '#ffe8a0', 'barracao_shade': '#3a2a4a', 'barracao_cord': '#3a3040',
    'barracao_cap': '#5a5a6a', 'barracao_cap_hi': '#8a8a9a', 'barracao_chevron': '#1e1e1e', 'barracao_cap_line': '#2a2a34',
    'barracao_mortar': '#50505e', 'barracao_plate_a': '#3a3a48', 'barracao_plate_b': '#42425a', 'barracao_plate_c': '#30303e', 'barracao_bolt': '#7a7a8a',
}
for r in range(8):
    PALETTE[f'barracao_tier{r}'] = br_samba.shade('#2a1a3a', r * 0.03)
K.register(PALETTE)
CARN = K.carn_roles('barracao')

# ----------------------------------------------------------------------------------------------- L0 the racks
def build_L0(rng):
    L = 'L0'
    br_samba.stands(L, 'barracao', rng, mode='props', carn=CARN)
    B = Builder('racks', L)
    # steel posts between the racks and work lamps hanging from above
    x = rng.uniform(0.5, 1.5)
    while x < P:
        B.rod('barracao_post', (x, 0.6, 0.0), (x, 0.6, 4.75), 0.07, segs=5)
        B.box('barracao_post', (x, 0.6, 4.78), (0.24, 0.24, 0.08), bevel=0.0)
        x += rng.uniform(3.0, 4.2)
    n = 7
    for k in range(n):
        lx = (k + 0.5) * P / n + rng.uniform(-0.8, 0.8)
        lz = rng.uniform(5.6, 6.6)
        for dx in wraps(lx, 0.5):
            B.rod('barracao_cord', (lx + dx, 2.0, 9.5), (lx + dx, 2.0, lz + 0.3), 0.025, segs=4)
            B.lathe('barracao_shade', [(0.08, 0.0), (0.42, -0.3), (0.42, -0.33)], 10, at=(lx + dx, 2.0, lz + 0.3), cap_bottom=False)
            B.sphere('barracao_lamp_glow', (lx + dx, 2.0, lz - 0.02), 0.17, subdiv=1)
    B.done()

# ----------------------------------------------------------------------------------------------- scene api
def clear():
    K.clear_collections(LAYERS)

def build(seed=1):
    """Build every parallax layer (clears first; deterministic for a seed). Returns {layer: Collection}."""
    clear()
    for name in LAYERS:
        new_collection(name)
    rng = random.Random(seed)
    build_L0(random.Random(rng.random()))
    return {name: K.COLL[name] for name in LAYERS}

# ----------------------------------------------------------------------------------------------- ground (metal)
def chevron_cap(B, cap, cap_hi, chevron, line, cap_h=6 * PX):
    """The metal cap: a grey band with dark hazard chevrons (8 px pitch, four per tile), a light top line, a dark
    seam under it."""
    B.box(cap, (GP / 2, 0.25, -cap_h / 2), (GP, 0.9, cap_h), bevel=0.0)
    B.box(cap_hi, (GP / 2, 0.23, -0.5 * PX), (GP, 0.92, 1.0 * PX), bevel=0.0)
    for col in range(8):
        for k in range(4):
            x = col * T + k * 8 * PX
            pts = [(x, -cap_h), (x + 4 * PX, -cap_h), (x + 8 * PX, -1.2 * PX), (x + 4 * PX, -1.2 * PX)]
            B.slab(chevron, pts, 0.5, at=(0.0, -0.45, 0.0))
    B.box(line, (GP / 2, -0.2, -cap_h - 0.5 * PX), (GP, 0.6, 1.0 * PX), bevel=0.0)

def build_ground(seed=1):
    """Metal: the chevron cap along the walking surface (z = 0) over bolted steel plates (two per tile, four bolts
    each) set in lighter steel, 3 tiles deep, tile-aligned (see cell_rects). Periodic in x with period GP,
    collection 'ground'."""
    L = GROUND_COLL
    c = new_collection(L)
    rng = random.Random(seed)
    D = GROUND_DEPTH
    B = Builder('ground_backing', L)
    B.box('barracao_mortar', (GP / 2, 0.5, -D / 2), (GP, 1.0, D), bevel=0.0)
    B.done(period=None)
    B = Builder('ground_cap', L)
    chevron_cap(B, 'barracao_cap', 'barracao_cap_hi', 'barracao_chevron', 'barracao_cap_line')
    B.done(period=None)
    B = Builder('ground_plates', L)
    roles = ['barracao_plate_a', 'barracao_plate_a', 'barracao_plate_b', 'barracao_plate_c']
    for col in range(8):
        for row in range(3):
            for xc, zc, w, h in cell_rects(col, row, rng, rows=(2,), cols=(1,), gap=0.07, top=(7.5 * PX if row == 0 else 0.0), jitter=0.15):
                B.box(rng.choice(roles), (xc, -0.1, zc), (w, 0.4, h), bevel=0.02)
                for sx in (-1, 1):
                    for sz in (-1, 1):
                        B.sphere('barracao_bolt', (xc + sx * (w / 2 - 0.09), -0.3, zc + sz * (h / 2 - 0.09)), 0.045, subdiv=1)
    B.done(period=None)
    return c

if __name__ == '__main__':
    seed = 1
    for i, a in enumerate(sys.argv):
        if a == '--seed' and i + 1 < len(sys.argv):
            seed = int(sys.argv[i + 1])
    K.preview(sys.modules[__name__], seed)
