"""Realistic Chinka: source materials (what the atlas bake reads) and a preview rig of lights/cameras.
M_CK_Skin: the painted 4K skin (MPFB UV), its roughness, a fine 3D noise bump; M_CK_Eye: Brady's iris texture darkened.
Run in the open Blender: exec(open(path).read())."""
import bpy, math
from mathutils import Vector
TEX = '/Users/bradymott/brady-o/private/work/tex/'
def img(name, path, cs, reload=True):
    im = bpy.data.images.get(name)
    if im and reload: im.filepath = path; im.reload()
    if im is None: im = bpy.data.images.load(path); im.name = name
    im.colorspace_settings.name = cs; return im
def newmat(name):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial'); p = nt.nodes.new('ShaderNodeBsdfPrincipled')
    nt.links.new(p.outputs[0], out.inputs[0]); return m, nt, p
# skin
m, nt, p = newmat('M_CK_Skin')
uv = nt.nodes.new('ShaderNodeUVMap'); uv.uv_map = 'UVMap'
tb = nt.nodes.new('ShaderNodeTexImage'); tb.image = img('T_Chinka_Skin_4k', TEX + 'T_Chinka_Skin_4k.png', 'sRGB')
tr = nt.nodes.new('ShaderNodeTexImage'); tr.image = img('T_Chinka_SkinRough_4k', TEX + 'T_Chinka_SkinRough_4k.png', 'Non-Color')
for t in (tb, tr): nt.links.new(uv.outputs[0], t.inputs['Vector'])
nt.links.new(tb.outputs['Color'], p.inputs['Base Color']); nt.links.new(tr.outputs['Color'], p.inputs['Roughness'])
try:
    p.inputs['Subsurface Weight'].default_value = 0.12; p.inputs['Subsurface Radius'].default_value = (0.9, 0.35, 0.2); p.inputs['Subsurface Scale'].default_value = 0.004
except Exception: pass
tc = nt.nodes.new('ShaderNodeTexCoord'); nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 900; nz.inputs['Detail'].default_value = 4
nt.links.new(tc.outputs['Object'], nz.inputs['Vector'])
bmp = nt.nodes.new('ShaderNodeBump'); bmp.inputs['Strength'].default_value = 0.12; bmp.inputs['Distance'].default_value = 0.0004
nt.links.new(nz.outputs['Fac'], bmp.inputs['Height']); nt.links.new(bmp.outputs['Normal'], p.inputs['Normal'])
m['burns_kind'] = 'skin'
h = bpy.data.objects['Chinka_Body']; h.data.materials.clear(); h.data.materials.append(m)
# eyes
m, nt, p = newmat('M_CK_Eye')
uv = nt.nodes.new('ShaderNodeUVMap'); uv.uv_map = 'UVMap'
te = nt.nodes.new('ShaderNodeTexImage'); te.image = img('T_Eye', TEX + 'T_Eye.png', 'sRGB'); nt.links.new(uv.outputs[0], te.inputs['Vector'])
hs = nt.nodes.new('ShaderNodeHueSaturation'); hs.inputs['Value'].default_value = 0.55; hs.inputs['Saturation'].default_value = 0.95
nt.links.new(te.outputs['Color'], hs.inputs['Color']); nt.links.new(hs.outputs['Color'], p.inputs['Base Color'])
p.inputs['Roughness'].default_value = 0.08; p.inputs['Coat Weight'].default_value = 0.5 if 'Coat Weight' in p.inputs else 0
m['burns_kind'] = 'generic'
for s in ('L', 'R'):
    o = bpy.data.objects.get('Chinka_Eye_' + s)
    if o: o.data.materials.clear(); o.data.materials.append(m)
# preview lights + world
sc = bpy.context.scene
def light(name, kind, energy, loc, col=(1, 1, 1), size=1.0):
    l = bpy.data.objects.get(name)
    if l is None: l = bpy.data.objects.new(name, bpy.data.lights.new(name, kind)); sc.collection.objects.link(l)
    l.data.energy = energy; l.data.color = col; l.location = loc
    if kind == 'AREA': l.data.size = size
    l.rotation_euler = (Vector((0, 0, 1.3)) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler(); return l
light('LD_Key', 'AREA', 140, (-1.2, -1.6, 2.2), (1, 0.95, 0.88), 1.2)
light('LD_Fill', 'AREA', 45, (1.5, -1.4, 1.5), (0.88, 0.92, 1), 1.5)
light('LD_Rim', 'AREA', 90, (0.6, 1.6, 2.0), (1, 0.9, 0.8), 1.0)
w = sc.world or bpy.data.worlds.new('World'); sc.world = w; w.use_nodes = True
bg = next(n for n in w.node_tree.nodes if n.type == 'BACKGROUND'); bg.inputs[0].default_value = (0.32, 0.3, 0.34, 1); bg.inputs[1].default_value = 0.6
for e in ('BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE'):
    try: sc.render.engine = e; break
    except TypeError: pass
sc.view_settings.view_transform = 'AgX' if 'AgX' in [i.identifier for i in bpy.types.ColorManagedViewSettings.bl_rna.properties['view_transform'].enum_items] else sc.view_settings.view_transform
print('lookdev ok', sc.render.engine)
