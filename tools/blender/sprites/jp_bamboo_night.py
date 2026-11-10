# Japan (level overhaul, docs/design/LEVEL_OVERHAUL.md §2/§8) V `jp_bamboo_night`: "Night of Things" (11-3 PHASE), the
# grove after the wind chime rings. Not wired into the game yet: the overhaul's engine work will add the theme; its key
# matches this atlas's name. The same diorama as jp_bamboo.py re-palette'd for a moonlit night: deep teal culms, pale
# leaves catching the moon, dark violet hills, a dark mossy floor.
import jp_kit as K
import jp_bamboo as A

MODULE = 'jp_bamboo_night'
P = A.P
LAYERS = A.LAYERS
BASES = A.BASES
SKY = ['#0a1024', '#18284a', '#2a3a5a']
PALETTE = dict(A.PALETTE)
PALETTE.update({
    'hill_far': '#2a3654', 'hill': '#222e48', 'hill_sh': '#1e2a42',
    'c1a': '#2e4a52', 'c1b': '#34525a', 'c1n': '#243c44', 'c1leaf': '#3a5a5a', 'c1leaf2': '#44646a', 'c1floor': '#1e3238',
    'c2a': '#2a5a4a', 'c2b': '#326452', 'c2c': '#3a6c58', 'c2n': '#1a3e32', 'c2leaf': '#3a6e56', 'c2leaf2': '#6aa08a',
    'c2floor': '#1a3a2e', 'c2floor2': '#224636',
    'g_cap': '#2e5a3a', 'g_cap_hi': '#4a7a52', 'g_blade': '#3a6a44', 'g_dirt': '#2a2228', 'g_rock': '#5a5a66',
})


def build(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.run_builders(A.BUILDERS, LAYERS, seed)


def build_ground(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.ground_earth(seed, tufts='grass', stone_p=0.45, patch_p=0.3, cap_h=0.3)


def clear():
    K.use(MODULE, PALETTE, LAYERS)
    K.clear()
