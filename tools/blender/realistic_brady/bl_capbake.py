# Bake photo projections + helper maps onto the Hair_Cap UVMap. Run one job per call (via timers).
import bpy, os, numpy as np
H = '/private/tmp/claude-501/-Users-bradymott-brady-o/3a6f4932-f787-49ea-89b0-6aabc7eb3e90/scratchpad/head/'
OUT = '/Users/bradymott/brady-o/private/work/proj/cap/'
os.makedirs(OUT, exist_ok=True)
RES = globals().get('CAP_RES', 2048)
JOB = globals()['CAP_JOB']    # ('photo', camname) | ('flow',) | ('fade',) | ('normal',)
sc = bpy.context.scene
sc.render.engine = 'CYCLES'; sc.cycles.samples = 4; sc.cycles.use_denoising = False
o = bpy.data.objects['Hair_Cap']; me = o.data
orig = list(me.materials)
mat = bpy.data.materials.get('M_CapBake') or bpy.data.materials.new('M_CapBake')
mat.use_nodes = True; nt = mat.node_tree; nt.nodes.clear()
outn = nt.nodes.new('ShaderNodeOutputMaterial')
target = nt.nodes.new('ShaderNodeTexImage')
def mathn(op, a, b):
    n = nt.nodes.new('ShaderNodeMath'); n.operation = op
    for i, v in enumerate((a, b)):
        if isinstance(v, (int, float)): n.inputs[i].default_value = v
        else: nt.links.new(v, n.inputs[i])
    return n.outputs[0]
others = []; Lo = None; bgn = None; wstr = None
if JOB[0] == 'photo':
    cam = bpy.data.objects[JOB[1]]
    W, Hh = cam['res']
    em = nt.nodes.new('ShaderNodeEmission'); dif = nt.nodes.new('ShaderNodeBsdfDiffuse'); add = nt.nodes.new('ShaderNodeAddShader')
    nt.links.new(em.outputs[0], add.inputs[0]); nt.links.new(dif.outputs[0], add.inputs[1]); nt.links.new(add.outputs[0], outn.inputs[0])
    tc = nt.nodes.new('ShaderNodeTexCoord'); tc.object = cam
    sep = nt.nodes.new('ShaderNodeSeparateXYZ'); nt.links.new(tc.outputs['Object'], sep.inputs[0])
    negz = mathn('MULTIPLY', sep.outputs['Z'], -1.0)
    f = cam.data.lens / 36.0 * max(W, Hh)
    u = mathn('ADD', mathn('MULTIPLY', mathn('DIVIDE', sep.outputs['X'], negz), f / W), 0.5)
    v = mathn('ADD', mathn('MULTIPLY', mathn('DIVIDE', sep.outputs['Y'], negz), f / Hh), 0.5)
    comb = nt.nodes.new('ShaderNodeCombineXYZ'); nt.links.new(u, comb.inputs[0]); nt.links.new(v, comb.inputs[1])
    img = nt.nodes.new('ShaderNodeTexImage'); img.extension = 'CLIP'; img.interpolation = 'Cubic'
    img.image = bpy.data.images.load(cam['ref_image'], check_existing=True)
    nt.links.new(comb.outputs[0], img.inputs[0]); nt.links.new(img.outputs[0], em.inputs[0])
    L = bpy.data.lights.get('ProjLight') or bpy.data.lights.new('ProjLight', 'POINT'); L.shadow_soft_size = 0; L.energy = 100
    Lo = bpy.data.objects.new('ProjLight', L); sc.collection.objects.link(Lo); Lo.location = cam.matrix_world.translation
    others = [ob for ob in sc.objects if ob.type == 'LIGHT' and ob != Lo and not ob.hide_render]
    for ob in others: ob.hide_render = True
    if sc.world:
        bgn = next((n for n in sc.world.node_tree.nodes if n.type == 'BACKGROUND'), None)
        if bgn: wstr = bgn.inputs[1].default_value; bgn.inputs[1].default_value = 0
    kinds = ('EMIT', 'DIFFUSE')
elif JOB[0] == 'flow':
    em = nt.nodes.new('ShaderNodeEmission'); nt.links.new(em.outputs[0], outn.inputs[0])
    uvn = nt.nodes.new('ShaderNodeUVMap'); uvn.uv_map = 'Flow'
    mp = nt.nodes.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (27.0, 1.6, 1.0)
    img = nt.nodes.new('ShaderNodeTexImage'); img.image = bpy.data.images.get('T_StrandTile') or bpy.data.images.load('/Users/bradymott/brady-o/private/work/tex/T_StrandTile.png'); img.extension = 'REPEAT'
    nt.links.new(uvn.outputs[0], mp.inputs[0]); nt.links.new(mp.outputs[0], img.inputs[0]); nt.links.new(img.outputs[0], em.inputs[0])
    kinds = ('EMIT',)
elif JOB[0] == 'fade':
    em = nt.nodes.new('ShaderNodeEmission'); nt.links.new(em.outputs[0], outn.inputs[0])
    at = nt.nodes.new('ShaderNodeAttribute'); at.attribute_name = 'Fade'
    nt.links.new(at.outputs['Color'], em.inputs[0])
    kinds = ('EMIT',)
elif JOB[0] == 'normal':
    bs = nt.nodes.new('ShaderNodeBsdfDiffuse'); nt.links.new(bs.outputs[0], outn.inputs[0])
    uvn = nt.nodes.new('ShaderNodeUVMap'); uvn.uv_map = 'Flow'
    mp = nt.nodes.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (27.0, 1.6, 1.0)
    img = nt.nodes.new('ShaderNodeTexImage'); img.image = bpy.data.images.get('T_StrandTile') or bpy.data.images.load('/Users/bradymott/brady-o/private/work/tex/T_StrandTile.png'); img.extension = 'REPEAT'
    nt.links.new(uvn.outputs[0], mp.inputs[0]); nt.links.new(mp.outputs[0], img.inputs[0])
    bp = nt.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = 1.0; bp.inputs['Distance'].default_value = 0.0006
    nt.links.new(img.outputs[0], bp.inputs['Height']); nt.links.new(bp.outputs[0], bs.inputs['Normal'])
    kinds = ('NORMAL',)
nt.nodes.active = target
me.materials.clear(); me.materials.append(mat)
me.uv_layers.active = me.uv_layers['UVMap']
for ob in bpy.context.view_layer.objects: ob.select_set(False)
o.select_set(True); bpy.context.view_layer.objects.active = o
tag = JOB[0] if JOB[0] != 'photo' else JOB[1]
for kind in kinds:
    t = bpy.data.images.new('capbake_tmp', RES, RES, float_buffer=True)
    t.colorspace_settings.name = 'Non-Color' if kind in ('DIFFUSE', 'NORMAL') else 'Linear Rec.709'
    target.image = t
    if kind == 'EMIT': bpy.ops.object.bake(type='EMIT', margin=6, use_clear=True)
    elif kind == 'DIFFUSE': bpy.ops.object.bake(type='DIFFUSE', pass_filter={'DIRECT'}, margin=6, use_clear=True)
    else: bpy.ops.object.bake(type='NORMAL', normal_space='TANGENT', margin=6, use_clear=True)
    a = np.empty(RES * RES * 4, np.float32); t.pixels.foreach_get(a)
    np.save(OUT + '%s_%s.npy' % (tag, kind), a.reshape(RES, RES, 4)[..., :3].astype(np.float16))
    bpy.data.images.remove(t)
for ob in others: ob.hide_render = False
if bgn is not None and wstr is not None: bgn.inputs[1].default_value = wstr
if Lo: bpy.data.objects.remove(Lo)
me.materials.clear()
for m in orig: me.materials.append(m)
print('capbake', tag)
