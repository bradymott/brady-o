"""Procedural cloth materials (rest-pose object space) whose folds, seams and hems get baked into the body atlas."""
import bpy
def node(nt, t, **kw):
    n = nt.nodes.new(t)
    for k, v in kw.items():
        if k in n.inputs: n.inputs[k].default_value = v
        else: setattr(n, k, v)
    return n
def math(nt, op, a, b=None, clamp=False):
    n = nt.nodes.new('ShaderNodeMath'); n.operation = op; n.use_clamp = clamp
    for i, v in enumerate((a, b)):
        if v is None: continue
        if isinstance(v, (int, float)): n.inputs[i].default_value = v
        else: nt.links.new(v, n.inputs[i])
    return n.outputs[0]
def band(nt, x, a, b, soft):          # smooth 1 inside [a, b]
    lo = nt.nodes.new('ShaderNodeMapRange'); lo.interpolation_type = 'SMOOTHSTEP'
    nt.links.new(x, lo.inputs['Value']); lo.inputs['From Min'].default_value = a - soft; lo.inputs['From Max'].default_value = a + soft
    hi = nt.nodes.new('ShaderNodeMapRange'); hi.interpolation_type = 'SMOOTHSTEP'
    nt.links.new(x, hi.inputs['Value']); hi.inputs['From Min'].default_value = b + soft; hi.inputs['From Max'].default_value = b - soft
    return math(nt, 'MULTIPLY', lo.outputs[0], hi.outputs[0])
def build(name, col, rough, folds, var=0.25):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    out = node(nt, 'ShaderNodeOutputMaterial'); bsdf = node(nt, 'ShaderNodeBsdfPrincipled')
    nt.links.new(bsdf.outputs[0], out.inputs[0])
    tc = node(nt, 'ShaderNodeTexCoord'); xyz = node(nt, 'ShaderNodeSeparateXYZ'); nt.links.new(tc.outputs['Object'], xyz.inputs[0])
    X, Y, Z = xyz.outputs
    ax = math(nt, 'ABSOLUTE', X)
    h = None; colmask = None
    for kind, args in folds:
        if kind == 'wave':      # (axis, freq, distort, lo, hi, soft, amp, maskaxis)
            axis, freq, dist, lo, hi, soft, amp, maxis = args
            w = node(nt, 'ShaderNodeTexWave', wave_type='BANDS', bands_direction=axis, Scale=freq, Distortion=dist * 2.0, **{'Detail': 2.0, 'Detail Scale': 1.5})
            nt.links.new(tc.outputs['Object'], w.inputs['Vector'])
            mk = band(nt, {'X': ax, 'Y': Y, 'Z': Z}[maxis], lo, hi, soft)
            br = node(nt, 'ShaderNodeTexNoise', Scale=4.0, Detail=2.0); nt.links.new(tc.outputs['Object'], br.inputs['Vector'])
            brk = math(nt, 'MULTIPLY', math(nt, 'SUBTRACT', br.outputs['Fac'], 0.3), 2.2, clamp=True)
            v = math(nt, 'MULTIPLY', math(nt, 'MULTIPLY', math(nt, 'MULTIPLY', w.outputs['Fac'], mk), brk), amp * 0.45)
        elif kind == 'noise':   # (scale, amp)
            sc_, amp = args
            n = node(nt, 'ShaderNodeTexNoise', Scale=sc_, Detail=4.0, Roughness=0.55)
            nt.links.new(tc.outputs['Object'], n.inputs['Vector'])
            v = math(nt, 'MULTIPLY', n.outputs['Fac'], amp)
        elif kind == 'ridge':   # a raised seam / hem band (axis, a, b, soft, amp)
            axis, a, b, soft, amp = args
            v = math(nt, 'MULTIPLY', band(nt, {'X': ax, 'Y': Y, 'Z': Z}[axis], a, b, soft), amp)
        elif kind == 'darken':  # colour mask (axis, a, b, soft, factor)
            axis, a, b, soft, f = args
            mk = math(nt, 'MULTIPLY', band(nt, {'X': ax, 'Y': Y, 'Z': Z}[axis], a, b, soft), f)
            colmask = mk if colmask is None else math(nt, 'ADD', colmask, mk)
            continue
        h = v if h is None else math(nt, 'ADD', h, v)
    bump = node(nt, 'ShaderNodeBump', Strength=1.0, Distance=0.004)
    nt.links.new(h, bump.inputs['Height']); nt.links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])
    # colour: slight mottling (sun-faded cotton) and darker folds
    nv = node(nt, 'ShaderNodeTexNoise', Scale=18.0, Detail=3.0); nt.links.new(tc.outputs['Object'], nv.inputs['Vector'])
    k = math(nt, 'ADD', math(nt, 'MULTIPLY', math(nt, 'SUBTRACT', nv.outputs['Fac'], 0.5), var), 1.0)
    if colmask is not None: k = math(nt, 'ADD', k, colmask)
    cm = node(nt, 'ShaderNodeVectorMath', operation='SCALE'); cm.inputs[0].default_value = col
    nt.links.new(k, cm.inputs['Scale']); nt.links.new(cm.outputs[0], bsdf.inputs['Base Color'])
    bsdf.inputs['Roughness'].default_value = rough
    bsdf.inputs['Specular IOR Level'].default_value = 0.35
    m['burns_kind'] = 'cloth'
    return m
TEE = build('M_Tee', (0.018, 0.018, 0.02), 0.82, [
    ('noise', (60.0, 0.15)),
    ('wave', ('Z', 9.0, 6.0, 0.97, 1.12, 0.03, 0.9, 'Z')),          # bunching above the hem
    ('wave', ('X', 14.0, 4.0, 0.22, 0.33, 0.03, 0.7, 'X')),         # sleeve folds
    ('wave', ('Y', 7.0, 8.0, 1.30, 1.42, 0.04, 0.6, 'Z')),          # armpit drag folds
    ('ridge', ('Z', 0.975, 0.995, 0.003, 0.5)),                      # bottom hem
    ('ridge', ('X', 0.31, 0.335, 0.003, 0.5)),                       # sleeve hems
    ('ridge', ('X', 0.17, 0.185, 0.002, 0.35)),                      # shoulder/sleeve seam
    ('ridge', ('Z', 1.525, 1.6, 0.004, 0.45)),                       # collar rib
])
TRO = build('M_Trousers', (0.015, 0.015, 0.017), 0.78, [
    ('noise', (70.0, 0.12)),
    ('wave', ('Z', 11.0, 5.0, 0.40, 0.60, 0.04, 0.8, 'Z')),         # knee folds
    ('wave', ('Z', 16.0, 6.0, 0.09, 0.24, 0.03, 1.2, 'Z')),         # ankle stacking
    ('wave', ('X', 10.0, 7.0, 0.78, 0.92, 0.04, 0.5, 'Z')),         # crotch / hip whiskers
    ('ridge', ('Z', 1.005, 1.045, 0.003, 0.6)),                      # waistband
    ('ridge', ('Z', 0.095, 0.11, 0.003, 0.4)),                       # cuff hem
    ('ridge', ('X', 0.165, 0.172, 0.0015, 0.3)),                     # outseam
])
SNK = build('M_Sneakers', (0.014, 0.014, 0.016), 0.6, [
    ('noise', (90.0, 0.1)),
    ('ridge', ('Z', -0.01, 0.028, 0.003, 0.8)),                      # sole edge
    ('wave', ('Y', 60.0, 1.0, 0.0, 0.0, 0.0, 0.0, 'Z')),             # placeholder (amp 0)
    ('ridge', ('Z', 0.11, 0.13, 0.004, 0.4)),                        # collar padding
    ('darken', ('Z', -0.01, 0.026, 0.002, 1.4)),                     # sole a little lighter (rubber)
])
for n, m in (('Tee', TEE), ('Trousers', TRO), ('Sneakers', SNK)):
    ob = bpy.data.objects[n]; ob.data.materials.clear(); ob.data.materials.append(m)
print('cloth mats ok')
