"""Realistic Chinka: rebuild the dressed character from the face-rigged checkpoint (private/work/chinka_faced.blend,
made by cb_tpose.py + cb_parts.py + cb_jaw.py on the MPFB human) and save private/work/chinka_full.blend.
Run in the open Blender: exec(open(path).read())."""
import bpy, os
D = os.path.dirname(os.path.abspath(globals().get('__file__', '/private/tmp/claude-501/-Users-bradymott-brady-o/648391df-fe8b-4bf7-9824-1904f05c84e5/scratchpad/wt-cast-1/tools/blender/realistic_chinka/cb_all.py'))) + '/'
D = globals().get('CK_DIR', D)
bpy.ops.wm.open_mainfile(filepath='/Users/bradymott/brady-o/private/work/chinka_faced.blend')
win = bpy.context.window_manager.windows[0]; area = next(a for a in win.screen.areas if a.type == 'VIEW_3D'); reg = next(r for r in area.regions if r.type == 'WINDOW')
with bpy.context.temp_override(window=win, area=area, region=reg):
    for f in ('cb_lookdev.py', 'cb_gown.py', 'cb_gownmat.py', 'cb_hair.py'):
        exec(open(D + f).read(), {'__name__': '__main__', 'CK_DIR': D})
bpy.ops.wm.save_as_mainfile(filepath='/Users/bradymott/brady-o/private/work/chinka_full.blend')
print('chinka_full rebuilt')
