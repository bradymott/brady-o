"""Realistic Brady pipeline (Blender 5.2 + MPFB2 2.0.18; run in the open Blender, scripts exec()-ed in this order after the
likeness head: bl_clothes, bl_clothmat, tattoo.py (numpy, outside Blender), rig via MPFB mixamo + bl_clips, bl_prep,
bl_atlas_uv, bl_bake_atlas, atlas_post.py + hairatlas.py (outside), bl_gamebuild, bl_lods, bl_export. Working files and
the reference photos live in private/work/ (git-ignored, never committed); these scripts embed no photos.

Export the realistic Brady per BURNS_GUIDE §6.12 (glTF Binary, selected, custom properties, +Y up, modifiers
applied, UVs/normals/tangents, no shape keys, skinning, deformation bones only, Actions, always sample, optimise)."""
import bpy, os
PATH = globals().get('EXPORT_PATH', '/Users/bradymott/brady-o/private/work/export/brady.glb')
os.makedirs(os.path.dirname(PATH), exist_ok=True)
arm = bpy.data.objects['Armature']
ad = arm.animation_data
if ad:
    for tr in list(ad.nla_tracks): ad.nla_tracks.remove(tr)
    ad.action = None
for pb in arm.pose.bones: pb.rotation_quaternion = (1, 0, 0, 0); pb.location = (0, 0, 0)
NAMES = ['Brady', 'Brady_Hair', 'Brady_LOD1', 'Brady_Hair_LOD1', 'Brady_LOD2']
for o in bpy.context.view_layer.objects: o.select_set(False)
arm.select_set(True)
for n in NAMES: bpy.data.objects[n].select_set(True)
bpy.context.view_layer.objects.active = arm
kw = dict(filepath=PATH, export_format='GLB', use_selection=True, export_extras=True, export_yup=True, export_apply=True,
          export_texcoord=True, export_normals=True, export_tangents=True, export_vertex_color='MATERIAL',
          export_materials='EXPORT', export_image_format='AUTO', export_morph=False, export_skins=True,
          export_all_influences=False, export_def_bones=True, export_animations=True, export_animation_mode='ACTIONS',
          export_force_sampling=True, export_optimize_animation_size=True, export_draco_mesh_compression_enable=False,
          export_lights=False, export_cameras=False, export_rest_position_armature=True)
sc = bpy.context.scene
for k in [k for k in sc.keys() if k.startswith('blendermcp')]: del sc[k]
props = bpy.ops.export_scene.gltf.get_rna_type().properties.keys()
kw = {k: v for k, v in kw.items() if k in props}
bpy.ops.export_scene.gltf(**kw)
print('exported', PATH, os.path.getsize(PATH))
