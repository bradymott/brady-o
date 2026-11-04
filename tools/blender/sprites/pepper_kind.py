# The chili (mx_pepper.py) exposed through the shared enemy-module contract, so render_country.py can render it.
import mx_pepper as PEP
KINDS = ['pepper']
POSES = {'pepper': list(PEP.POSES)}
HEIGHT = {'pepper': 0.85}
def build(kind, pose='idle', t=0.0): return PEP.build_pepper(pose=pose, t=t)
def clear(): PEP.clear()
