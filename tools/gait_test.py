"""Check planted-foot motion without requiring Blender. Run: python3 tools/gait_test.py."""
import ast
import math
from pathlib import Path

source = (Path(__file__).parent / 'blender' / 'charkit.py').read_text()
tree = ast.parse(source)
gait = next(n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == 'gait')
env = {'math': math, 'TAU': math.tau, 'hang': lambda *args: None}
exec(compile(ast.Module(body=[gait], type_ignores=[]), '<gait>', 'exec'), env)

class Pose:
    def __init__(self):
        self.legs = {}
        self.ctx = {}
    def leg(self, side, **values):
        self.legs[side] = values
    def arm(self, *args, **values):
        pass

for run in (False, True):
    period, contact, cycle = (.8, .32, 3.) if run else (1., .60, 1.45)
    worst = 0
    for scale in (.9167, 1., 1.0278):
        rig = type('Rig', (), {'k': scale})()
        for i in range(101):
            q = contact * i / 100
            p = Pose()
            env['gait'](p, q * period, rig, period, .5, .02, .1, .5, 1., run)
            leg = p.legs['L']
            thigh, knee = leg['thigh'], leg['knee']
            z = scale * (.45 * math.sin(thigh) + .41 * math.sin(thigh-knee))
            y = .86 * scale + p.hips[1] - scale * (.45 * math.cos(thigh) + .41 * math.cos(thigh-knee))
            error = max(abs(y), abs(cycle * q * scale + z - cycle * contact * .5 * scale))
            worst = max(worst, error)
    assert worst < 1e-7, worst
    print(('run' if run else 'walk') + ': planted-foot forward-kinematics error ' + str(worst))
