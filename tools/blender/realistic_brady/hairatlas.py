import numpy as np
from PIL import Image
W = '/Users/bradymott/brady-o/private/work/tex/'
LIN = lambda c: np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
SRGB = lambda c: np.where(c <= 0.0031308, c * 12.92, 1.055 * np.clip(c, 0, None) ** (1 / 2.4) - 0.055)
cap = Image.open(W + 'T_HairCap_2k.png').convert('RGBA').resize((512, 1024), Image.LANCZOS)
cards = np.asarray(Image.open(W + 'T_HairCards.png').convert('RGBA').resize((512, 1024), Image.LANCZOS)).astype(np.float32) / 255
tint = np.array([0.42, 0.40, 0.38])
cards[..., :3] = SRGB(LIN(cards[..., :3]) * tint)
out = np.zeros((1024, 1024, 4), np.float32)
out[:, :512] = np.asarray(cap).astype(np.float32) / 255
out[:, 512:] = cards
Image.fromarray((np.clip(out, 0, 1) * 255 + 0.5).astype(np.uint8)).save(W + 'T_BradyRB_Hair.png')
print('ok')
