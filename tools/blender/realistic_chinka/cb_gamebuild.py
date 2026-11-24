"""Realistic Chinka, step 8: the shipped game meshes (BURNS_GUIDE §6.12 contract): 'Chinka' (opaque: one body texture
set T_CK_Base/ORM/Normal; materials skin / cloth / generic / glow, the glow one emitting its base colour so the LED
beads light up with no extra draw or texture), 'Chinka_Hair' (alpha-clip cutout, T_Chinka_Hair), skinned to 'Armature'.
(Generalised from realistic_brady/bl_gamebuild.py.) Run in the open Blender after the atlas bake + atlas_post_ck.py."""
import bpy, os, numpy as np
exec(open('/private/tmp/claude-501/-Users-bradymott-brady-o/648391df-fe8b-4bf7-9824-1904f05c84e5/scratchpad/wt-cast-1/tools/blender/realistic_chinka/ck_util.py').read())
TEX = '/Users/bradymott/brady-o/private/work/tex/'
CFG = globals().get('GB_CFG', {})
arm = bpy.data.objects['Armature']; M = 'mixamorig:'
def sel(objs, active=None):
    for o in bpy.context.view_layer.objects: o.select_set(False)
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = active or objs[0]
def img(name, path, cs):
    im = bpy.data.images.get(name)
    if im: bpy.data.images.remove(im)
    im = bpy.data.images.load(path); im.name = name; im.colorspace_settings.name = cs
    return im
IB = img('T_CK_Base', TEX + 'T_CK_Base.jpg', 'sRGB')
IO = img('T_CK_ORM', TEX + 'T_CK_ORM.jpg', 'Non-Color')
IN = img('T_CK_Normal', TEX + 'T_CK_Normal.png', 'Non-Color')
IH = img('T_CK_Hair', TEX + 'T_Chinka_Hair.png', 'sRGB')
def gltf_out(nt):
    g = bpy.data.node_groups.get('glTF Material Output')
    if g is None:
        g = bpy.data.node_groups.new('glTF Material Output', 'ShaderNodeTree')
        g.interface.new_socket('Occlusion', in_out='INPUT', socket_type='NodeSocketFloat')
        g.interface.new_socket('Thickness', in_out='INPUT', socket_type='NodeSocketFloat')
    n = nt.nodes.new('ShaderNodeGroup'); n.node_tree = g; return n
def body_mat(name, kind, emit=0.0):
    m = bpy.data.materials.get(name)
    if m: bpy.data.materials.remove(m)
    m = bpy.data.materials.new(name)
    m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial'); p = nt.nodes.new('ShaderNodeBsdfPrincipled')
    nt.links.new(p.outputs[0], out.inputs[0])
    uv = nt.nodes.new('ShaderNodeUVMap'); uv.uv_map = 'UVMap'
    tb = nt.nodes.new('ShaderNodeTexImage'); tb.image = IB
    to = nt.nodes.new('ShaderNodeTexImage'); to.image = IO
    tn = nt.nodes.new('ShaderNodeTexImage'); tn.image = IN
    for t in (tb, to, tn): nt.links.new(uv.outputs[0], t.inputs['Vector'])
    nt.links.new(tb.outputs['Color'], p.inputs['Base Color'])
    sp = nt.nodes.new('ShaderNodeSeparateColor'); nt.links.new(to.outputs['Color'], sp.inputs[0])
    nt.links.new(sp.outputs['Green'], p.inputs['Roughness']); nt.links.new(sp.outputs['Blue'], p.inputs['Metallic'])
    go = gltf_out(nt); nt.links.new(sp.outputs['Red'], go.inputs['Occlusion'])
    nm = nt.nodes.new('ShaderNodeNormalMap'); nm.uv_map = 'UVMap'; nt.links.new(tn.outputs['Color'], nm.inputs['Color'])
    nt.links.new(nm.outputs['Normal'], p.inputs['Normal'])
    if emit:
        nt.links.new(tb.outputs['Color'], p.inputs['Emission Color']); p.inputs['Emission Strength'].default_value = emit
    m['burns_kind'] = kind; m.use_backface_culling = True
    return m
def hair_mat(name):
    m = bpy.data.materials.get(name)
    if m: bpy.data.materials.remove(m)
    m = bpy.data.materials.new(name)
    m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial'); p = nt.nodes.new('ShaderNodeBsdfPrincipled'); nt.links.new(p.outputs[0], out.inputs[0])
    uv = nt.nodes.new('ShaderNodeUVMap'); uv.uv_map = 'UVMap'
    t = nt.nodes.new('ShaderNodeTexImage'); t.image = IH; nt.links.new(uv.outputs[0], t.inputs['Vector'])
    vc = nt.nodes.new('ShaderNodeVertexColor'); vc.layer_name = 'Col'
    mix = nt.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'; mix.blend_type = 'MULTIPLY'; mix.inputs['Factor'].default_value = 1.0
    nt.links.new(t.outputs['Color'], mix.inputs['A']); nt.links.new(vc.outputs['Color'], mix.inputs['B']); nt.links.new(mix.outputs['Result'], p.inputs['Base Color'])
    r = nt.nodes.new('ShaderNodeMath'); r.operation = 'ROUND'; nt.links.new(t.outputs['Alpha'], r.inputs[0]); nt.links.new(r.outputs[0], p.inputs['Alpha'])
    p.inputs['Roughness'].default_value = 0.6; p.inputs['Specular IOR Level'].default_value = 0.1; p.inputs['Metallic'].default_value = 0.0
    m['burns_kind'] = 'hair'; m.use_backface_culling = False
    try: m.surface_render_method = 'DITHERED'
    except Exception: pass
    return m
MS = body_mat('M_CKG_Skin', 'skin'); MC = body_mat('M_CKG_Cloth', 'cloth'); MG = body_mat('M_CKG_Generic', 'generic')
ML = body_mat('M_CKG_Glow', 'generic', emit=CFG.get('led_strength', 3.0))
MH = hair_mat('M_CKG_Hair')
def prep(ob, mat, keep_uv):
    sel([ob])
    for md in list(ob.modifiers):
        if md.type != 'ARMATURE': bpy.ops.object.modifier_apply(modifier=md.name)
    me = ob.data; src = me.uv_layers[keep_uv]
    a = np.empty(len(me.loops) * 2, np.float32); src.data.foreach_get('uv', a)
    for u in list(me.uv_layers): me.uv_layers.remove(u)
    u = me.uv_layers.new(name='UVMap'); u.data.foreach_set('uv', a)
    me.materials.clear(); me.materials.append(mat)
    return a
def drop_colors(ob, keep=()):
    me = ob.data
    for ca in list(me.color_attributes):
        if ca.name not in keep: me.color_attributes.remove(ca)
    for a in [x.name for x in me.attributes if x.name in ('Trim',)]: me.attributes.remove(me.attributes[a])
opaque = {'Chinka_Body': MS, 'CK_Bodice': MC, 'CK_Skirt': MC, 'Chinka_Eye_L': MG, 'Chinka_Eye_R': MG, 'CK_Belt': MG,
          'CK_Flats': MG, 'CK_Gold': MG, 'CK_Chain': MG, 'CK_LED': ML}
for n, m in opaque.items():
    ob = bpy.data.objects[n]; prep(ob, m, 'Atlas'); drop_colors(ob)
hair = ['CK_HairCap', 'CK_HairCards', 'CK_BrowsLashes']
for n in hair:
    ob = bpy.data.objects[n]; prep(ob, MH, 'UVMap'); drop_colors(ob, keep=('Col',))
    me = ob.data; ca = me.color_attributes.get('Col')
    if ca is None:
        ca = me.color_attributes.new('Col', 'BYTE_COLOR', 'CORNER'); ca.data.foreach_set('color', np.ones(len(me.loops) * 4, np.float32))
    elif ca.domain != 'CORNER' or ca.data_type != 'BYTE_COLOR':
        sel([ob]); me.color_attributes.active_color = ca; bpy.ops.geometry.color_attribute_convert(domain='CORNER', data_type='BYTE_COLOR')
    me.color_attributes.active_color = me.color_attributes['Col']
def join(names, newname):
    objs = [bpy.data.objects[n] for n in names]
    sel(objs, objs[0]); bpy.ops.object.join()
    ob = bpy.context.view_layer.objects.active; ob.name = newname; ob.data.name = newname
    return ob
CK = join(list(opaque.keys()), 'Chinka')
HR = join(hair, 'Chinka_Hair')
for ob in (CK, HR):
    limit_normalize(ob)
    for p in ob.data.polygons: p.use_smooth = True
    ob.parent = arm; ob.matrix_parent_inverse.identity()
    for md in ob.modifiers:
        if md.type == 'ARMATURE': md.object = arm
def tris(ob): return sum(len(p.vertices) - 2 for p in ob.data.polygons)
print('LOD0 tris', tris(CK), tris(HR), 'verts', len(CK.data.vertices), len(HR.data.vertices))
