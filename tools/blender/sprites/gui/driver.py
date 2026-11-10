# Runs one sprite-pipeline script inside a private Blender GUI instance, then quits.
#   DRIVE_SCRIPT=<script.py> DRIVE_ARGS='a b c' (after "--") plus the script's own env vars
import bpy, os, sys, runpy, traceback
def run():
    code = 0
    script = os.environ['DRIVE_SCRIPT']
    args = os.environ.get('DRIVE_ARGS', '').split()
    sys.argv = [bpy.app.binary_path, '--'] + args
    try:
        runpy.run_path(script, run_name='__main__')
    except SystemExit as e:
        code = e.code if isinstance(e.code, int) else (0 if e.code is None else 1)
    except Exception:
        traceback.print_exc(); code = 1
    print('DRIVER_DONE', code, flush=True)
    open(os.environ.get('DRIVE_STATUS', '/dev/null'), 'w').write(str(code))
    os._exit(code)
def later():
    run(); return None
if os.environ.get('DRIVE_DEFER'):
    bpy.app.timers.register(later, first_interval=0.5)
else:
    run()
