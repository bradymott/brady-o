"""Realistic Chinka, step 1: the MPFB 2 human (Blender 5.2.3 + MPFB 2.0.18; run in the open Blender, never -b) with the
likeness targets read from her photos (fuller cheeks, softer chin, rounded nose tip, full lips, almond eyes; warm brown
skin and dark eyes come from skin_paint.py), 1.67 m, then MPFB's Mixamo rig.

Pipeline (scripts in this folder, in order; the reference photos stay in private/scans and are never committed):
  cb_human.py -> cb_tpose.py -> cb_legs.py -> cb_parts.py -> cb_jaw.py -> cb_likeness.py   (save private/work/chinka_faced.blend)
  skin_paint.py (numpy, outside Blender) ; hair_tex.py (numpy)
  cb_all.py (= cb_lookdev, cb_gown, cb_gownmat, cb_hair from the faced checkpoint) -> cb_prepgame.py -> cb_atlas.py (bake)
  atlas_post_ck.py (numpy) -> cb_finish.py (= cb_gamebuild, cb_lods, cb_clips, cb_export)
  node ../realistic_brady/strip_face_channels.js private/work/export/chinka.glb
  python ck_extras.py private/work/export/chinka.glb burns_smile=0.45 ; cp to assets/models/shared/chinka.glb
Run: exec(open(path).read()) in the open Blender, under a 3D-view context override (see cb_all.py)."""
import bpy, sys, os
mods = {m.split('.')[-1]: sys.modules[m] for m in sys.modules if m.startswith('bl_ext.user_default.mpfb.')}
HS = mods['humanservice'].HumanService; TS = mods['targetservice'].TargetService
HOP = next(getattr(m, 'HumanObjectProperties') for m in mods.values() if hasattr(m, 'HumanObjectProperties'))
T = "/Users/bradymott/Library/Application Support/Blender/5.2/extensions/user_default/mpfb/data/targets/"
macro = {"gender": 0.0, "age": 0.62, "muscle": 0.5, "weight": 0.47, "proportions": 0.65, "height": 0.575, "cupsize": 0.5, "firmness": 0.6,
         "race": {"asian": 0.32, "caucasian": 0.48, "african": 0.20}}
LIKE = {
    'head/head-round': 0.05, 'head/head-oval': 0.55, 'head/head-scale-vert-incr': 0.12, 'head/head-scale-horiz-decr': 0.08,
    'cheek/l-cheek-volume-incr': 0.15, 'cheek/r-cheek-volume-incr': 0.15, 'cheek/l-cheek-bones-incr': 0.45, 'cheek/r-cheek-bones-incr': 0.45,
    'chin/chin-width-incr': 0.1, 'chin/chin-jaw-drop-decr': 0.1, 'chin/chin-prominent-incr': 0.15,
    'nose/nose-point-width-incr': 0.40, 'nose/nose-flaring-incr': 0.30, 'nose/nose-hump-decr': 0.30, 'nose/nose-scale-vert-decr': 0.12,
    'nose/nose-nostrils-width-incr': 0.25, 'nose/nose-volume-incr': 0.15, 'nose/nose-point-up': 0.15, 'nose/nose-scale-depth-incr': 0.15,
    'mouth/mouth-scale-horiz-incr': 0.25, 'mouth/mouth-lowerlip-volume-incr': 0.35, 'mouth/mouth-upperlip-volume-incr': 0.30,
    'mouth/mouth-cupidsbow-incr': 0.25, 'mouth/mouth-angles-up': 0.20, 'mouth/mouth-upperlip-height-decr': 0.15,
    'eyes/l-eye-corner2-up': 0.30, 'eyes/r-eye-corner2-up': 0.30, 'eyes/l-eye-height2-decr': 0.10, 'eyes/r-eye-height2-decr': 0.10,
    'eyes/l-eye-bag-decr': 0.3, 'eyes/r-eye-bag-decr': 0.3, 'eyes/l-eye-eyefold-down': 0.2, 'eyes/r-eye-eyefold-down': 0.2,
    'eyebrows/eyebrows-angle-up': 0.15, 'forehead/forehead-scale-vert-incr': 0.1,
    'torso/measure-waist-circ-decr': 0.25, 'torso/measure-hips-circ-incr': 0.20, 'buttocks/buttocks-volume-incr': 0.25, 'neck/neck-scale-horiz-decr': 0.15,
}
win = bpy.context.window_manager.windows[0]; area = next(a for a in win.screen.areas if a.type == 'VIEW_3D'); reg = next(r for r in area.regions if r.type == 'WINDOW')
with bpy.context.temp_override(window=win, area=area, region=reg):
    h = HS.create_human(mask_helpers=True, detailed_helpers=True, extra_vertex_groups=True, feet_on_ground=True, scale=0.1, macro_detail_dict=macro)
h.name = 'Chinka_Body'
for k, w in LIKE.items():
    p = T + k + '.target.gz'
    if os.path.exists(p): TS.load_target(h, p, weight=w, name=os.path.basename(k))
TS.reapply_macro_details(h)
for o in bpy.context.view_layer.objects:
    if o: o.select_set(False)
h.select_set(True); bpy.context.view_layer.objects.active = h
with bpy.context.temp_override(window=win, area=area, region=reg):
    HS.add_builtin_rig(h, 'mixamo', import_weights=True)
print('Chinka_Body ready for cb_tpose.py')
