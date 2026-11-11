# Nepal (level overhaul, docs/design/LEVEL_OVERHAUL.md §2/§8) V `np_depot`: "Baron's Supply Depot" (12-7 FORT, secret),
# a variant of the fortress kit (np_fortress.py). Not wired into the game yet: the overhaul's engine work will add the
# theme; its key matches this atlas's name. The vault in a colder, workaday palette: slate-violet wall panels, the
# Baron's banners, and the shelves stacked with his stencilled supply crates instead of snow globes; a steel floor.
import jp_kit as K
import np_fortress as F

MODULE = 'np_depot'
P = F.P
LAYERS = F.LAYERS
BASES = F.BASES
SKY = ['#1a1a3a', '#2a2a50', '#3a3a64']
PALETTE = dict(F.PALETTE)
PALETTE.update({
    'wall': '#2e2a4a', 'wall2': '#34305a', 'trim': '#a8a0b8', 'banner': '#4a1a8a', 'emblem': '#ffd84a', 'shelf': '#3a3658',
    'crate': '#b08a52', 'crate2': '#7a5a30',
    'g_cap': '#a8a0b8', 'g_cap_hi': '#d8d0e8', 'g_dirt': '#2a2838', 'g_rock': '#5a5870', 'g_rock2': '#4e4c64', 'g_vein': '#7a7890',
})


def build(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.run_builders({'L0': lambda rng: F.build_L0(rng, crates=True)}, LAYERS, seed)


def build_ground(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return F.build_ground(seed, keep=True)


def clear():
    K.use(MODULE, PALETTE, LAYERS)
    K.clear()
