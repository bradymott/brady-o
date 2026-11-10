# Morocco (level overhaul) V `ma_azul_night`: Chefchaouen Blue after the sun-moon lantern is struck (5-3 night phase).
# The same diorama as ma_azul.py re-palette'd for night: deep indigo walls, glowing windows and lanterns, dark hills.
import ma_kit as K
import ma_azul as A

MODULE = 'ma_azul_night'
P = A.P
LAYERS = A.LAYERS
BASES = A.BASES
SKY = ['#0a0e2a', '#1a2a5a', '#3a3a6a']
PALETTE = dict(A.PALETTE)
PALETTE.update({
    'rif': '#2a3a4a', 'rif_sh': '#22303e', 'rif2': '#32445a', 'rif2_sh': '#2a3a4c', 'rif_plain': '#2a3a4a',
    'fhouse': '#3a5a8a', 'fhouse2': '#ffd890',
    'blue1': '#2a4a8a', 'blue2': '#34589a', 'blue3': '#3e64a4', 'blue4': '#244080', 'white': '#8aa4cc', 'trim': '#1a3060',
    'door': '#121e40', 'win_glow': '#ffc870', 'stair': '#3a64a8', 'stair2': '#2e5494',
    'pot_r': '#9a3a3a', 'pot_y': '#a88a3a', 'pot_g': '#2a6a4a', 'pot_p': '#9a4a7a', 'leaf': '#1e4a3a', 'bloom': '#c84a5a', 'bloom2': '#c8c8d8',
    'brass': '#a8883a', 'pane_glow': '#ffd890', 'wire': '#121a30', 'plain2': '#2a4a7a',
    'g_cap': '#8aa8d8', 'g_cap_hi': '#a8c4e8', 'g_dirt': '#4a6aa0', 'g_dirt2': '#3a5a90', 'g_rock': '#5a7ab0',
})


def build(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.run_builders(A.BUILDERS, LAYERS, seed)


def build_ground(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.ground_earth(seed, tufts=None, stone_p=0.75, patch_p=0.1)


def clear():
    K.use(MODULE, PALETTE, LAYERS)
    K.clear()
