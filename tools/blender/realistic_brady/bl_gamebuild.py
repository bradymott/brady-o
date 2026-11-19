"""Build the shipped game meshes: 'Brady' (opaque, one body texture set), 'Brady_Hair' (alpha-clip cutout, one hair
atlas), their LOD1/LOD2 siblings, the materials with burns_kind, all skinned to 'Armature'."""
import bpy, bmesh, numpy as np, json
TEX = '/Users/bradymott/brady-o/private/work/tex/'
G = globals().get('GB_CFG', {})
arm = bpy.data.objects['Armature']
def sel(objs, active=None):
    for o in bpy.context.view_layer.objects: o.select_set(False)
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = active or objs[0]
def img(name, path, cs):
    im = bpy.data.images.get(name)
    if im: bpy.data.images.remove(im)
    im = bpy.data.images.load(path); im.name = name; im.colorspace_settings.name = cs
    return im
IB = img('T_BradyRB_Base', TEX + 'T_BradyRB_Base.jpg', 'sRGB')
IO = img('T_BradyRB_ORM', TEX + 'T_BradyRB_ORM.jpg', 'Non-Color')
IN = img('T_BradyRB_Normal', TEX + 'T_BradyRB_Normal.png', 'Non-Color')
IH = img('T_BradyRB_Hair', TEX + 'T_BradyRB_Hair.png', 'sRGB')
def gltf_out(nt):
    g = bpy.data.node_groups.get('glTF Material Output')
    if g is None:
        g = bpy.data.node_groups.new('glTF Material Output', 'ShaderNodeTree')
        g.interface.new_socket('Occlusion', in_out='INPUT', socket_type='NodeSocketFloat')
        g.interface.new_socket('Thickness', in_out='INPUT', socket_type='NodeSocketFloat')
    n = nt.nodes.new('ShaderNodeGroup'); n.node_tree = g; return n
def body_mat(name, kind, base_factor=(1, 1, 1, 1), rough_factor=1.0):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial'); p = nt.nodes.new('ShaderNodeBsdfPrincipled')
    nt.links.new(p.outputs[0], out.inputs[0])
    uv = nt.nodes.new('ShaderNodeUVMap'); uv.uv_map = 'UVMap'
    tb = nt.nodes.new('ShaderNodeTexImage'); tb.image = IB
    to = nt.nodes.new('ShaderNodeTexImage'); to.image = IO
    tn = nt.nodes.new('ShaderNodeTexImage'); tn.image = IN
    for t in (tb, to, tn): nt.links.new(uv.outputs[0], t.inputs['Vector'])
    if tuple(base_factor) != (1, 1, 1, 1):
        mix = nt.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'; mix.blend_type = 'MULTIPLY'; mix.inputs['Factor'].default_value = 1.0
        nt.links.new(tb.outputs['Color'], mix.inputs['A']); mix.inputs['B'].default_value = base_factor
        nt.links.new(mix.outputs['Result'], p.inputs['Base Color'])
    else:
        nt.links.new(tb.outputs['Color'], p.inputs['Base Color'])
    sp = nt.nodes.new('ShaderNodeSeparateColor'); nt.links.new(to.outputs['Color'], sp.inputs[0])
    nt.links.new(sp.outputs['Green'], p.inputs['Roughness']); nt.links.new(sp.outputs['Blue'], p.inputs['Metallic'])
    go = gltf_out(nt); nt.links.new(sp.outputs['Red'], go.inputs['Occlusion'])
    nm = nt.nodes.new('ShaderNodeNormalMap'); nm.uv_map = 'UVMap'; nt.links.new(tn.outputs['Color'], nm.inputs['Color'])
    nt.links.new(nm.outputs['Normal'], p.inputs['Normal'])
    m['burns_kind'] = kind; m.use_backface_culling = True
    return m
def hair_mat(name):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial'); p = nt.nodes.new('ShaderNodeBsdfPrincipled')
    nt.links.new(p.outputs[0], out.inputs[0])
    uv = nt.nodes.new('ShaderNodeUVMap'); uv.uv_map = 'UVMap'
    t = nt.nodes.new('ShaderNodeTexImage'); t.image = IH; nt.links.new(uv.outputs[0], t.inputs['Vector'])
    vc = nt.nodes.new('ShaderNodeVertexColor'); vc.layer_name = 'Col'
    mix = nt.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'; mix.blend_type = 'MULTIPLY'; mix.inputs['Factor'].default_value = 1.0
    nt.links.new(t.outputs['Color'], mix.inputs['A']); nt.links.new(vc.outputs['Color'], mix.inputs['B'])
    nt.links.new(mix.outputs['Result'], p.inputs['Base Color'])
    r = nt.nodes.new('ShaderNodeMath'); r.operation = 'ROUND'; nt.links.new(t.outputs['Alpha'], r.inputs[0])
    nt.links.new(r.outputs[0], p.inputs['Alpha'])
    p.inputs['Roughness'].default_value = 0.65; p.inputs['Specular IOR Level'].default_value = 0.1
    m['burns_kind'] = 'hair'; m.use_backface_culling = False
    try: m.surface_render_method = 'DITHERED'
    except Exception: pass
    return m
MS = body_mat('M_BradyRB_Skin', 'skin')
MC = body_mat('M_BradyRB_Cloth', 'cloth')
MG = body_mat('M_BradyRB_Generic', 'generic')
ML = body_mat('M_BradyRB_Lens', 'generic')
MH = hair_mat('M_BradyRB_Hair')
def prep(ob, mat, keep_uv):
    """apply non-armature modifiers, one UV layer named UVMap (from keep_uv), one material"""
    sel([ob])
    for md in list(ob.modifiers):
        if md.type != 'ARMATURE': bpy.ops.object.modifier_apply(modifier=md.name)
    me = ob.data
    src = me.uv_layers[keep_uv]
    a = np.empty(len(me.loops) * 2, np.float32); src.data.foreach_get('uv', a)
    for u in list(me.uv_layers): me.uv_layers.remove(u)
    u = me.uv_layers.new(name='UVMap'); u.data.foreach_set('uv', a)
    me.materials.clear(); me.materials.append(mat)
    return a
def ensure_col(ob, white=False):
    me = ob.data
    for ca in list(me.color_attributes):
        if ca.name != 'Col': me.color_attributes.remove(ca)
    ca = me.color_attributes.get('Col')
    if ca is None or white:
        if ca: me.color_attributes.remove(ca)
        ca = me.color_attributes.new('Col', 'BYTE_COLOR', 'CORNER')
        c = np.ones(len(me.loops) * 4, np.float32); ca.data.foreach_set('color', c)
    elif ca.domain != 'CORNER' or ca.data_type != 'BYTE_COLOR':
        sel([ob]); me.color_attributes.active_color = ca
        bpy.ops.geometry.color_attribute_convert(domain='CORNER', data_type='BYTE_COLOR')
    me.color_attributes.active_color = me.color_attributes['Col']
    for a in [x.name for x in me.attributes if x.name in ('Fade',)]: me.attributes.remove(me.attributes[a])
# --- opaque parts
opaque = {'Brady_Body': MS, 'Tee': MC, 'Trousers': MC, 'Sneakers': MC, 'Brady_Eye_L': MG, 'Brady_Eye_R': MG,
          'Sunglasses_Frame': MG, 'Sunglasses_Temples': MG, 'Sunglasses_Lenses': ML, 'Hair_Tie': MG}
for n, m in opaque.items(): prep(bpy.data.objects[n], m, 'Atlas')
# --- hair parts: cap -> left half of the hair atlas, cards/bun/flyaways/lashes -> right half
hair = ['Hair_Cap', 'Hair_Cards', 'Hair_Bun', 'Hair_Flyaways', 'Brows_Lashes']
for n in hair:
    ob = bpy.data.objects[n]
    a = prep(ob, MH, 'UVMap').reshape(-1, 2)
    a[:, 0] = a[:, 0] * 0.5 + (0.0 if n == 'Hair_Cap' else 0.5)
    ob.data.uv_layers['UVMap'].data.foreach_set('uv', a.ravel())
    ensure_col(ob)
# lashes ride the upper lids
bl = bpy.data.objects['Brows_Lashes']
for s in ('Left', 'Right'):
    e = arm.data.bones['mixamorig:%sEyelid' % s].head_local
    vg = bl.vertex_groups.get('mixamorig:%sEyelid' % s) or bl.vertex_groups.new(name='mixamorig:%sEyelid' % s)
    hg = bl.vertex_groups['mixamorig:Head']
    for v in bl.data.vertices:
        if (v.co - e).length < 0.03 and v.co.z > e.z - 0.002 and (v.co.x > 0) == (s == 'Left'):
            vg.add([v.index], 1.0, 'REPLACE'); hg.add([v.index], 0.0, 'REPLACE')
# --- join
def join(names, newname):
    objs = [bpy.data.objects[n] for n in names]
    sel(objs, objs[0]); bpy.ops.object.join()
    ob = bpy.context.view_layer.objects.active; ob.name = newname; ob.data.name = newname
    return ob
BR = join(list(opaque.keys()), 'Brady')
HR = join(hair, 'Brady_Hair')
for ob in (BR, HR):
    sel([ob]); bpy.ops.object.vertex_group_clean(group_select_mode='ALL', limit=0.001)
    bpy.ops.object.vertex_group_limit_total(group_select_mode='ALL', limit=4)
    bpy.ops.object.vertex_group_normalize_all(lock_active=False)
    for p in ob.data.polygons: p.use_smooth = True
    ob.parent = arm; ob.matrix_parent_inverse.identity()
def tris(ob): return sum(len(p.vertices) - 2 for p in ob.data.polygons)
print('LOD0 tris', tris(BR), tris(HR), 'verts', len(BR.data.vertices), len(HR.data.vertices))
