"""Realistic cast kit, step 5: source materials for the atlas bake: each body's painted neutral skin (MPFB UV, 4K, from
realistic_chinka/skin_paint.py with work cfgs castf/castm) on its region meshes, with a fine 3D noise bump; the eyes
(Brady's iris texture, a neutral dark brown). Garment/hat/glasses materials come from kc_parts.py."""
import bpy
TEX = '/Users/bradymott/brady-o/private/work/tex/'
def img(name, path, cs):
    im = bpy.data.images.get(name)
    if im: im.filepath = path; im.reload()
    else: im = bpy.data.images.load(path); im.name = name
    im.colorspace_settings.name = cs; return im
def newmat(name):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial'); p = nt.nodes.new('ShaderNodeBsdfPrincipled'); nt.links.new(p.outputs[0], out.inputs[0])
    return m, nt, p
for S in ('F', 'M'):
    m, nt, p = newmat('M_KC_Skin' + S)
    uv = nt.nodes.new('ShaderNodeUVMap'); uv.uv_map = 'UVMap'
    tb = nt.nodes.new('ShaderNodeTexImage'); tb.image = img('T_Cast%s_Skin' % S, TEX + 'T_Cast%s_Skin_4k.png' % S, 'sRGB')
    tr = nt.nodes.new('ShaderNodeTexImage'); tr.image = img('T_Cast%s_SkinRough' % S, TEX + 'T_Cast%s_SkinRough_4k.png' % S, 'Non-Color')
    for t in (tb, tr): nt.links.new(uv.outputs[0], t.inputs['Vector'])
    nt.links.new(tb.outputs['Color'], p.inputs['Base Color']); nt.links.new(tr.outputs['Color'], p.inputs['Roughness'])
    tc = nt.nodes.new('ShaderNodeTexCoord'); nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 900; nz.inputs['Detail'].default_value = 4
    nt.links.new(tc.outputs['Object'], nz.inputs['Vector'])
    b = nt.nodes.new('ShaderNodeBump'); b.inputs['Strength'].default_value = 0.12; b.inputs['Distance'].default_value = 0.0004
    nt.links.new(nz.outputs['Fac'], b.inputs['Height']); nt.links.new(b.outputs['Normal'], p.inputs['Normal'])
    m['burns_kind'] = 'skin'
    for o in bpy.data.objects:
        if o.type == 'MESH' and o.name.startswith(S + '_body_'): o.data.materials.clear(); o.data.materials.append(m)
m, nt, p = newmat('M_KC_Eye')
uv = nt.nodes.new('ShaderNodeUVMap'); uv.uv_map = 'UVMap'
te = nt.nodes.new('ShaderNodeTexImage'); te.image = img('T_Eye', TEX + 'T_Eye.png', 'sRGB'); nt.links.new(uv.outputs[0], te.inputs['Vector'])
hs = nt.nodes.new('ShaderNodeHueSaturation'); hs.inputs['Value'].default_value = 0.7; nt.links.new(te.outputs['Color'], hs.inputs['Color']); nt.links.new(hs.outputs['Color'], p.inputs['Base Color'])
p.inputs['Roughness'].default_value = 0.08; m['burns_kind'] = 'generic'
for S in ('F', 'M'):
    for s in ('L', 'R'):
        o = bpy.data.objects.get('Cast%s_Eye_%s' % (S, s))
        if o: o.data.materials.clear(); o.data.materials.append(m)
print('kit materials ok')
