"""Realistic cast kit, step 1: the two shared base bodies the NPCs are composed from (MPFB 2, generic faces, deliberately
unlike Brady and Chinka): CastF (woman) and CastM (man), each rigged with MPFB's Mixamo rig, fingers folded into the
hands, T-posed with straight legs (the rest realistic Brady and Chinka use, so charkit's clips drive all of them), the
helper geometry removed, eyeballs, face joints (Jaw, eyelids, mouth corners) with procedural weights.
Armatures are named ArmF / ArmM (bones keep the mixamorig: names). Landmarks: private/work/proj/castf_lm.json, castm_lm.json.
Run in the open Blender: exec(open(path).read(), {'CK_DIR': <realistic_chinka dir>/})."""
import bpy, sys, os
CK = globals().get('CK_DIR', '/private/tmp/claude-501/-Users-bradymott-brady-o/648391df-fe8b-4bf7-9824-1904f05c84e5/scratchpad/wt-cast-1/tools/blender/realistic_chinka/')
T = "/Users/bradymott/Library/Application Support/Blender/5.2/extensions/user_default/mpfb/data/targets/"
mods = {m.split('.')[-1]: sys.modules[m] for m in sys.modules if m.startswith('bl_ext.user_default.mpfb.')}
HS = mods['humanservice'].HumanService; TS = mods['targetservice'].TargetService
PEOPLE = {
    'F': dict(macro={"gender": 0.0, "age": 0.47, "muscle": 0.5, "weight": 0.5, "proportions": 0.6, "height": 0.52, "cupsize": 0.5, "firmness": 0.55,
                     "race": {"asian": 0.25, "caucasian": 0.5, "african": 0.25}},
              targets={'head/head-oval': 0.4, 'eyes/l-eye-scale-incr': 0.08, 'eyes/r-eye-scale-incr': 0.08, 'mouth/mouth-lowerlip-volume-incr': 0.2,
                       'mouth/mouth-upperlip-volume-incr': 0.15, 'nose/nose-scale-horiz-decr': 0.1, 'cheek/l-cheek-bones-incr': 0.25, 'cheek/r-cheek-bones-incr': 0.25,
                       'chin/chin-prominent-incr': 0.1, 'eyebrows/eyebrows-angle-up': 0.1}),
    'M': dict(macro={"gender": 1.0, "age": 0.52, "muscle": 0.56, "weight": 0.52, "proportions": 0.6, "height": 0.55, "cupsize": 0.5, "firmness": 0.5,
                     "race": {"asian": 0.25, "caucasian": 0.45, "african": 0.3}},
              targets={'head/head-square': 0.25, 'chin/chin-width-incr': 0.2, 'chin/chin-prominent-incr': 0.15, 'nose/nose-scale-depth-incr': 0.1,
                       'nose/nose-hump-incr': 0.1, 'eyebrows/eyebrows-trans-down': 0.1, 'mouth/mouth-scale-horiz-incr': 0.1, 'neck/neck-scale-horiz-incr': 0.15}),
}
win = bpy.context.window_manager.windows[0]; area = next(a for a in win.screen.areas if a.type == 'VIEW_3D'); reg = next(r for r in area.regions if r.type == 'WINDOW')
for key in globals().get('ONLY', ('F', 'M')):
    P = PEOPLE[key]; BODY = 'Cast%s_Body' % key; RIG = 'Arm%s' % key
    for o in list(bpy.data.objects):
        if o.name in (BODY, RIG): bpy.data.objects.remove(o)
    for o in bpy.context.view_layer.objects: o.select_set(False)
    with bpy.context.temp_override(window=win, area=area, region=reg):
        h = HS.create_human(mask_helpers=True, detailed_helpers=True, extra_vertex_groups=True, feet_on_ground=True, scale=0.1, macro_detail_dict=P['macro'])
    h.name = BODY
    for k, w in P['targets'].items():
        p = T + k + '.target.gz'
        if os.path.exists(p): TS.load_target(h, p, weight=w, name=os.path.basename(k))
        else: print('missing target', k)
    for o in bpy.context.view_layer.objects: o.select_set(False)
    h.select_set(True); bpy.context.view_layer.objects.active = h
    with bpy.context.temp_override(window=win, area=area, region=reg):
        HS.add_builtin_rig(h, 'mixamo', import_weights=True)
        G = {'BODY': BODY, 'RIG': RIG, 'EYE': 'Cast%s_Eye_' % key, 'LM_FILE': 'cast%s_lm.json' % key.lower(), '__name__': '__main__'}
        for f in ('cb_tpose.py', 'cb_legs.py', 'cb_parts.py', 'cb_jaw.py'):
            exec(open(CK + f).read(), dict(G))
    print('built', BODY, RIG, len(bpy.data.objects[RIG].data.bones))
