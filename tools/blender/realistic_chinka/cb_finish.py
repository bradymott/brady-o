"""Realistic Chinka: after the atlas bake and atlas_post_ck.py, build the game meshes, LODs and clips and export.
Run in the open Blender on the baked scene: exec(open(path).read(), {'CK_DIR': <this folder>/})."""
import bpy
D = globals()['CK_DIR']
bpy.ops.wm.save_as_mainfile(filepath='/Users/bradymott/brady-o/private/work/chinka_atlas.blend')
win = bpy.context.window_manager.windows[0]; area = next(a for a in win.screen.areas if a.type == 'VIEW_3D'); reg = next(r for r in area.regions if r.type == 'WINDOW')
with bpy.context.temp_override(window=win, area=area, region=reg):
    for f in ('cb_gamebuild.py', 'cb_lods.py', 'cb_clips.py'):
        exec(open(D + f).read(), {'__name__': '__main__'})
bpy.ops.wm.save_as_mainfile(filepath='/Users/bradymott/brady-o/private/work/chinka_game.blend')
with bpy.context.temp_override(window=win, area=area, region=reg):
    exec(open(D + 'cb_export.py').read(), {'__name__': '__main__'})
