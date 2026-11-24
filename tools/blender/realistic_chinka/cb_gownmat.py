"""Realistic Chinka: the gown's source materials (read by the atlas bake). Ivory cloth with a woven-noise grain, gold
trim within 1.1 cm of the bodice's open edges (attribute 'Trim') and a gold double stripe at the skirt hem (UV v);
polished gold; LED beads coloured from the 'LED' corner colour, emissive. Run in the open Blender."""
import bpy
def newmat(name):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial'); p = nt.nodes.new('ShaderNodeBsdfPrincipled')
    nt.links.new(p.outputs[0], out.inputs[0]); return m, nt, p
def hexc(h, a=1.0):
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c) + (a,)
IVORY, GOLD = hexc('#efe4cc'), hexc('#d8a648')
def mix(nt, fac, a, b):
    mx = nt.nodes.new('ShaderNodeMix'); mx.data_type = 'RGBA'
    nt.links.new(fac, mx.inputs['Factor'])
    for sock, v in (('A', a), ('B', b)):
        if isinstance(v, tuple): mx.inputs[sock].default_value = v
        else: nt.links.new(v, mx.inputs[sock])
    return mx.outputs['Result']
def mixf(nt, fac, a, b):
    mx = nt.nodes.new('ShaderNodeMix'); mx.data_type = 'FLOAT'
    nt.links.new(fac, mx.inputs['Factor']); mx.inputs['A'].default_value = a; mx.inputs['B'].default_value = b
    return mx.outputs['Result']
def grain(nt, scale=260, k=0.06):
    tc = nt.nodes.new('ShaderNodeTexCoord'); nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = scale; nz.inputs['Detail'].default_value = 3
    nt.links.new(tc.outputs['Object'], nz.inputs['Vector'])
    mr = nt.nodes.new('ShaderNodeMapRange'); mr.inputs['To Min'].default_value = 1 - k; mr.inputs['To Max'].default_value = 1 + k
    nt.links.new(nz.outputs['Fac'], mr.inputs['Value'])
    bmp = nt.nodes.new('ShaderNodeBump'); bmp.inputs['Strength'].default_value = 0.15; bmp.inputs['Distance'].default_value = 0.0005
    nt.links.new(nz.outputs['Fac'], bmp.inputs['Height'])
    return mr.outputs['Result'], bmp.outputs['Normal']
def tinted(nt, col, g):
    m = nt.nodes.new('ShaderNodeVectorMath'); m.operation = 'SCALE'; m.inputs[0].default_value = col[:3]
    nt.links.new(g, m.inputs['Scale']); return m.outputs['Vector']
# ---- bodice: ivory, gold trim near the open edges
m, nt, p = newmat('M_CK_Bodice'); g, n = grain(nt)
at = nt.nodes.new('ShaderNodeAttribute'); at.attribute_name = 'Trim'
st = nt.nodes.new('ShaderNodeMath'); st.operation = 'LESS_THAN'; st.inputs[1].default_value = 0.011; nt.links.new(at.outputs['Fac'], st.inputs[0])
ln = nt.nodes.new('ShaderNodeMath'); ln.operation = 'LESS_THAN'; ln.inputs[1].default_value = 0.0035; nt.links.new(at.outputs['Fac'], ln.inputs[0])
band = nt.nodes.new('ShaderNodeMath'); band.operation = 'SUBTRACT'; nt.links.new(st.outputs[0], band.inputs[0]); nt.links.new(ln.outputs[0], band.inputs[1])
# trim = 1.1 cm gold with a thin ivory line inside it (a two-line braid at phone size)
gap = nt.nodes.new('ShaderNodeMath'); gap.operation = 'COMPARE'; gap.inputs[1].default_value = 0.0062; gap.inputs[2].default_value = 0.0011; nt.links.new(at.outputs['Fac'], gap.inputs[0])
tr = nt.nodes.new('ShaderNodeMath'); tr.operation = 'SUBTRACT'; nt.links.new(st.outputs[0], tr.inputs[0]); nt.links.new(gap.outputs[0], tr.inputs[1])
trc = nt.nodes.new('ShaderNodeClamp'); nt.links.new(tr.outputs[0], trc.inputs['Value'])
nt.links.new(mix(nt, trc.outputs[0], tinted(nt, IVORY, g), GOLD), p.inputs['Base Color'])
nt.links.new(mixf(nt, trc.outputs[0], 0.72, 0.3), p.inputs['Roughness']); nt.links.new(mixf(nt, trc.outputs[0], 0.0, 1.0), p.inputs['Metallic'])
nt.links.new(n, p.inputs['Normal']); m['burns_kind'] = 'cloth'
bpy.data.objects['CK_Bodice'].data.materials.clear(); bpy.data.objects['CK_Bodice'].data.materials.append(m)
# ---- skirt: ivory, gold double stripe at the hem (UV v = 0 at the hem; the 16 rows span v 0..1)
m, nt, p = newmat('M_CK_Skirt'); g, n = grain(nt, 220)
uv = nt.nodes.new('ShaderNodeUVMap'); uv.uv_map = 'UVMap'; sp = nt.nodes.new('ShaderNodeSeparateXYZ'); nt.links.new(uv.outputs[0], sp.inputs[0])
def lt(v, k):
    x = nt.nodes.new('ShaderNodeMath'); x.operation = 'LESS_THAN'; x.inputs[1].default_value = k; nt.links.new(v, x.inputs[0]); return x.outputs[0]
s1 = lt(sp.outputs['Y'], 0.022); s2a = lt(sp.outputs['Y'], 0.04); s2b = lt(sp.outputs['Y'], 0.032)
s2 = nt.nodes.new('ShaderNodeMath'); s2.operation = 'SUBTRACT'; nt.links.new(s2a, s2.inputs[0]); nt.links.new(s2b, s2.inputs[1])
gs = nt.nodes.new('ShaderNodeMath'); gs.operation = 'ADD'; gs.use_clamp = True; nt.links.new(s1, gs.inputs[0]); nt.links.new(s2.outputs[0], gs.inputs[1])
nt.links.new(mix(nt, gs.outputs[0], tinted(nt, IVORY, g), GOLD), p.inputs['Base Color'])
nt.links.new(mixf(nt, gs.outputs[0], 0.74, 0.3), p.inputs['Roughness']); nt.links.new(mixf(nt, gs.outputs[0], 0.0, 1.0), p.inputs['Metallic'])
nt.links.new(n, p.inputs['Normal']); m['burns_kind'] = 'cloth'
bpy.data.objects['CK_Skirt'].data.materials.clear(); bpy.data.objects['CK_Skirt'].data.materials.append(m)
# ---- gold (belt, flats, hoops, bangles, chain)
m, nt, p = newmat('M_CK_Gold'); g, n = grain(nt, 500, 0.08)
nt.links.new(tinted(nt, GOLD, g), p.inputs['Base Color']); p.inputs['Metallic'].default_value = 1.0; p.inputs['Roughness'].default_value = 0.28
nt.links.new(n, p.inputs['Normal']); m['burns_kind'] = 'generic'
for o in ('CK_Belt', 'CK_Flats', 'CK_Gold', 'CK_Chain'):
    bpy.data.objects[o].data.materials.clear(); bpy.data.objects[o].data.materials.append(m)
# ---- LED beads
m, nt, p = newmat('M_CK_LED')
ca = nt.nodes.new('ShaderNodeVertexColor'); ca.layer_name = 'LED'
nt.links.new(ca.outputs['Color'], p.inputs['Base Color']); nt.links.new(ca.outputs['Color'], p.inputs['Emission Color'])
p.inputs['Emission Strength'].default_value = 4.0; p.inputs['Roughness'].default_value = 0.25
m['burns_kind'] = 'generic'
bpy.data.objects['CK_LED'].data.materials.clear(); bpy.data.objects['CK_LED'].data.materials.append(m)
print('gown materials ok')
