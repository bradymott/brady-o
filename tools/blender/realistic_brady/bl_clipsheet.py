"""Workbench stills of every clip (a few frames each) from a 3/4 camera into private/work/wip/clips/."""
import bpy, os, math
from mathutils import Vector
OUT = globals().get('SHEET_OUT', '/Users/bradymott/brady-o/private/work/wip/clips/')
os.makedirs(OUT, exist_ok=True)
arm = bpy.data.objects['Armature']; sc = bpy.context.scene
cam = bpy.data.objects.get('Cam_Clip')
if cam is None:
    cam = bpy.data.objects.new('Cam_Clip', bpy.data.cameras.new('Cam_Clip')); sc.collection.objects.link(cam)
view = globals().get('SHEET_VIEW', (0.75, -1.0, 0.25)); dist = globals().get('SHEET_DIST', 4.2)
tgt = Vector(globals().get('SHEET_TGT', (0, 0, 0.85)))
d = Vector(view).normalized(); cam.location = tgt + d * dist
cam.rotation_euler = (-d).to_track_quat('-Z', 'Y').to_euler(); cam.data.lens = 50
sc.camera = cam
prev_engine = sc.render.engine
sc.render.engine = 'BLENDER_WORKBENCH'
sc.display.shading.light = 'STUDIO'; sc.display.shading.color_type = 'MATERIAL'
sc.render.resolution_x, sc.render.resolution_y = globals().get('SHEET_RES', (360, 480)); sc.render.resolution_percentage = 100
sc.render.film_transparent = False
# a floor so foot contact shows
fl = bpy.data.objects.get('ClipFloor')
if fl is None:
    me = bpy.data.meshes.new('ClipFloor'); me.from_pydata([(-3, -3, 0), (3, -3, 0), (3, 3, 0), (-3, 3, 0)], [], [(0, 1, 2, 3)])
    fl = bpy.data.objects.new('ClipFloor', me); sc.collection.objects.link(fl)
fl.hide_render = False
clips = globals().get('SHEET_CLIPS') or [a.name for a in bpy.data.actions if not a.name.startswith('face_')]
fracs = globals().get('SHEET_FRACS', (0.0, 0.25, 0.5, 0.75))
ad = arm.animation_data
for tr in ad.nla_tracks: tr.mute = True
files = []
for name in clips:
    act = bpy.data.actions[name]; ad.action = act
    if hasattr(ad, 'action_slot') and len(act.slots): ad.action_slot = act.slots[0]
    f0, f1 = act.frame_range
    for k, fr in enumerate(fracs):
        f = int(round(f0 + (f1 - f0) * fr)); sc.frame_set(f)
        p = os.path.join(OUT, '%s_%d.png' % (name, k)); sc.render.filepath = p
        bpy.ops.render.render(write_still=True); files.append(p)
ad.action = None
for tr in ad.nla_tracks: tr.mute = False
for pb in arm.pose.bones: pb.rotation_quaternion = (1, 0, 0, 0); pb.location = (0, 0, 0)
fl.hide_render = True; fl.hide_viewport = True
sc.render.engine = prev_engine
print('rendered', len(files))
open(OUT + 'done.txt', 'w').write(str(len(files)))
