"""Realistic cast kit: lay out and bake the kit atlas with realistic_chinka/cb_atlas.py (kit object list, island weights,
output folder). Run in the open Blender on private/work/cast_kit.blend after kc_materials.py; poll for
private/work/tex/kc_atlas/atlas_done.txt, then run kc_atlas_post.py outside Blender and save cast_kit_atlas.blend."""
import bpy
D = '/private/tmp/claude-501/-Users-bradymott-brady-o/648391df-fe8b-4bf7-9824-1904f05c84e5/scratchpad/wt-cast-1/tools/blender/'
W = '/Users/bradymott/brady-o/private/work/'
objs = [o.name for o in bpy.data.objects if o.type == 'MESH' and (o.name[:2] in ('F_', 'M_')) and '_hair_' not in o.name] + ['Cast%s_Eye_%s' % (S, s) for S in 'FM' for s in 'LR']
def wfn(n, c):
    if '_body_head' in n: return 2.2
    if '_body_hand' in n: return 0.8
    if '_body_' in n: return 0.55
    if 'Eye' in n: return 1.6
    if '_face_' in n: return 0.8
    if '_shoe_' in n or '_eyes_' in n: return 0.35
    return 0.45
for o in bpy.data.objects:
    if o.type == 'MESH': o.hide_set(False); o.hide_render = False
for n in ('CastF_Body', 'CastM_Body'): bpy.data.objects[n].hide_set(True)
win = bpy.context.window_manager.windows[0]; area = next(a for a in win.screen.areas if a.type == 'VIEW_3D'); reg = next(r for r in area.regions if r.type == 'WINDOW')
with bpy.context.temp_override(window=win, area=area, region=reg):
    exec(open(D + 'realistic_chinka/cb_atlas.py').read(), {'__name__': '__main__', 'ATLAS_OBJS': objs, 'SMART_UV': (), 'ATLAS_WEIGHT': wfn,
        'ATLAS_OUT': W + 'tex/kc_atlas/', 'ATLAS_META': W + 'proj/kc_atlas_meta.json', 'SWATCH_NAME': 'KitSwatch', 'SWATCH_MAT': 'M_KC_Hair', 'ATLAS_CFG': {'margin': 0.004, 'jobs': ['base', 'rough', 'metal', 'normal']}})
