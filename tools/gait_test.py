"""Check the Blender walk clip's planted-foot motion without Blender (pure maths read out of charkit.py), and that the
run clip keeps the classic gait shipped in brady.glb. Run: python3 -I tools/gait_test.py (exits non-zero on failure)."""
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

for run in (False,):
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

# The run: the planted-foot gait read as a stiff speed-walk, so clip_run uses gait_classic (main's run, which the
# shipped brady.glb carries); check the wiring and that the classic stride is wide.
run_fn = next(n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == 'clip_run')
assert any(isinstance(c, ast.Call) and getattr(c.func, 'id', '') == 'gait_classic' for c in ast.walk(run_fn)), 'clip_run must use gait_classic'
classic = next(n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == 'gait_classic')
exec(compile(ast.Module(body=[classic], type_ignores=[]), '<gait_classic>', 'exec'), env)
p = Pose(); rig = type('Rig', (), {'k': 1.0})(); spread = 0
for i in range(40):
    env['gait_classic'](p, .8 * i / 40, rig, .8, .75, .05, .22, .7, 1.4, True)
    spread = max(spread, abs(p.legs['L']['thigh'] - p.legs['R']['thigh']))
assert spread > 1.3, spread
print('run: classic gait, thigh split ' + str(round(spread, 2)) + ' rad')
