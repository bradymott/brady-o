"""Realistic cast kit, step 7: export the kit (both armatures, every part and its LOD siblings, the F_/M_ clips) to
private/work/export/cast.glb (glTF Binary, BURNS_GUIDE §6.12 settings). Then outside Blender:
  node tools/blender/realistic_brady/strip_face_channels.js private/work/export/cast.glb
  python tools/blender/realistic_chinka/ck_extras.py private/work/export/cast.glb burns_kit=<private/work/proj/cast_kit.json>
  cp private/work/export/cast.glb assets/models/burning-man/cast.glb"""
import bpy, os
PATH = globals().get('EXPORT_PATH', '/Users/bradymott/brady-o/private/work/export/cast.glb')
os.makedirs(os.path.dirname(PATH), exist_ok=True)
coll = bpy.data.collections['Kit']
for X in ('F', 'M'):
    arm = bpy.data.objects['Arm' + X]
    if arm.animation_data: arm.animation_data.action = None
    for pb in arm.pose.bones: pb.rotation_quaternion = (1, 0, 0, 0); pb.location = (0, 0, 0)
objs = [o for o in coll.objects if o.type == 'MESH' and o.name[:2] in ('F_', 'M_')]
for o in bpy.context.view_layer.objects:
    if o: o.select_set(False)
for o in objs: o.hide_set(False); o.select_set(True)
for X in ('F', 'M'): bpy.data.objects['Arm' + X].select_set(True)
bpy.context.view_layer.objects.active = bpy.data.objects['ArmF']
kw = dict(filepath=PATH, export_format='GLB', use_selection=True, export_extras=True, export_yup=True, export_apply=True,
          export_texcoord=True, export_normals=True, export_tangents=True, export_vertex_color='NAME', export_vertex_color_name='BurnsMask', export_all_vertex_colors=False,
          export_materials='EXPORT', export_image_format='AUTO', export_morph=False, export_skins=True,
          export_all_influences=False, export_def_bones=True, export_animations=True, export_animation_mode='NLA_TRACKS',
          export_force_sampling=True, export_optimize_animation_size=True, export_draco_mesh_compression_enable=False,
          export_lights=False, export_cameras=False, export_rest_position_armature=True)
sc = bpy.context.scene
for k in [k for k in sc.keys() if k.startswith('blendermcp')]: del sc[k]
props = bpy.ops.export_scene.gltf.get_rna_type().properties.keys()
bpy.ops.export_scene.gltf(**{k: v for k, v in kw.items() if k in props})
print('exported', PATH, os.path.getsize(PATH), len(objs), 'meshes')
