"""Realistic cast kit: from the baked atlas checkpoint (private/work/cast_kit_atlas.blend; kc_atlas_post.py already run),
build the game parts and LODs, key the F_/M_ clips and export private/work/export/cast.glb.
Pipeline: kc_humans.py -> kc_parts.py -> kc_regions.py -> kc_hair.py -> kc_materials.py -> realistic_chinka/cb_atlas.py
(with the kit's object list, see kc_atlas_run.py) -> kc_atlas_post.py -> kc_finish.py (kc_game.py, kc_extras.py, clips, export) -> strip_face_channels.js -> kc_install.py
Run in the open Blender: exec(open(path).read())."""
import bpy
D = '/private/tmp/claude-501/-Users-bradymott-brady-o/648391df-fe8b-4bf7-9824-1904f05c84e5/scratchpad/wt-cast-1/tools/blender/'
W = '/Users/bradymott/brady-o/private/work/'
bpy.ops.wm.open_mainfile(filepath=W + 'cast_kit_atlas.blend')
win = bpy.context.window_manager.windows[0]; area = next(a for a in win.screen.areas if a.type == 'VIEW_3D'); reg = next(r for r in area.regions if r.type == 'WINDOW')
with bpy.context.temp_override(window=win, area=area, region=reg):
    exec(open(D + 'realistic_cast/kc_game.py').read(), {'__name__': '__main__'})
    exec(open(D + 'realistic_cast/kc_extras.py').read(), {'__name__': '__main__'})
    for X, h in (('F', 1.58), ('M', 1.78)):
        exec(open(D + 'realistic_chinka/cb_clips.py').read(), {'__name__': '__main__', 'RIG': 'Arm' + X, 'ACT_PREFIX': X + '_', 'RIG_H': h, 'CLIP_CFG': {'jaw': 0.2}})
bpy.ops.wm.save_as_mainfile(filepath=W + 'cast_kit_game.blend')
import io, contextlib, os
buf = io.StringIO()
with bpy.context.temp_override(window=win, area=area, region=reg), contextlib.redirect_stdout(buf):
    exec(open(D + 'realistic_cast/kc_export.py').read(), {'__name__': '__main__'})
print([l for l in buf.getvalue().splitlines() if l.startswith('exported')], 'warnings', buf.getvalue().count('WARNING'))
