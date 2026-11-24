"""Realistic cast kit, step 6 (after the atlas bake + kc_atlas_post.py): the shipped kit meshes. Every part stays its own
object (the engine composes characters from them) named as in the manifest, with LOD siblings '<part>_LOD1/_LOD2':
  opaque parts  one texture set (T_KC_Base/ORM/Normal) - materials skin / cloth / generic / beard (hair shading, opaque)
  hair          LOD0: alpha cards on T_Cast_Hair (the only cutout, so a composed character is 2 draws close up);
                LOD1: half the cards + the cap, opaque on the atlas hair swatch; LOD2: the cap and a quarter of the long
                cards, opaque - far characters are ONE draw.
Weights: <= 4 per vertex, normalised (ck_util.limit_normalize)."""
import bpy, bmesh, json, random, numpy as np
W = '/Users/bradymott/brady-o/private/work/'; TEX = W + 'tex/'
exec(open('/private/tmp/claude-501/-Users-bradymott-brady-o/648391df-fe8b-4bf7-9824-1904f05c84e5/scratchpad/wt-cast-1/tools/blender/realistic_chinka/ck_util.py').read())
coll = bpy.data.collections['Kit']
def sel(objs, active=None):
    bpy.context.view_layer.update()
    for o in bpy.context.view_layer.objects:
        if o: o.select_set(False)
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = active or objs[0]
def tris(ob): return sum(len(p.vertices) - 2 for p in ob.data.polygons)
def img(name, path, cs):
    im = bpy.data.images.get(name)
    if im: bpy.data.images.remove(im)
    im = bpy.data.images.load(path); im.name = name; im.colorspace_settings.name = cs; return im
IB = img('T_KC_Base', TEX + 'T_KC_Base.jpg', 'sRGB'); IO = img('T_KC_ORM', TEX + 'T_KC_ORM.jpg', 'Non-Color')
IN = img('T_KC_Normal', TEX + 'T_KC_Normal.png', 'Non-Color'); IH = img('T_KC_Hair', TEX + 'T_Cast_Hair.png', 'sRGB')
def gltf_out(nt):
    g = bpy.data.node_groups.get('glTF Material Output')
    if g is None:
        g = bpy.data.node_groups.new('glTF Material Output', 'ShaderNodeTree')
        g.interface.new_socket('Occlusion', in_out='INPUT', socket_type='NodeSocketFloat'); g.interface.new_socket('Thickness', in_out='INPUT', socket_type='NodeSocketFloat')
    n = nt.nodes.new('ShaderNodeGroup'); n.node_tree = g; return n
def body_mat(name, kind):
    m = bpy.data.materials.get(name)
    if m: bpy.data.materials.remove(m)
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial'); p = nt.nodes.new('ShaderNodeBsdfPrincipled'); nt.links.new(p.outputs[0], out.inputs[0])
    uv = nt.nodes.new('ShaderNodeUVMap'); uv.uv_map = 'UVMap'
    tb = nt.nodes.new('ShaderNodeTexImage'); tb.image = IB; to = nt.nodes.new('ShaderNodeTexImage'); to.image = IO; tn = nt.nodes.new('ShaderNodeTexImage'); tn.image = IN
    for t in (tb, to, tn): nt.links.new(uv.outputs[0], t.inputs['Vector'])
    nt.links.new(tb.outputs['Color'], p.inputs['Base Color'])
    sp = nt.nodes.new('ShaderNodeSeparateColor'); nt.links.new(to.outputs['Color'], sp.inputs[0])
    nt.links.new(sp.outputs['Green'], p.inputs['Roughness']); nt.links.new(sp.outputs['Blue'], p.inputs['Metallic'])
    go = gltf_out(nt); nt.links.new(sp.outputs['Red'], go.inputs['Occlusion'])
    nm = nt.nodes.new('ShaderNodeNormalMap'); nm.uv_map = 'UVMap'; nt.links.new(tn.outputs['Color'], nm.inputs['Color']); nt.links.new(nm.outputs['Normal'], p.inputs['Normal'])
    m['burns_kind'] = kind; m.use_backface_culling = True; return m
MS = body_mat('M_KCG_Skin', 'skin'); MC = body_mat('M_KCG_Cloth', 'cloth'); MG = body_mat('M_KCG_Generic', 'generic'); MB = body_mat('M_KCG_Beard', 'hair')
MH = bpy.data.materials.get('M_KCG_Hair') or bpy.data.materials.new('M_KCG_Hair')
MH.use_nodes = True; nt = MH.node_tree; nt.nodes.clear()
out = nt.nodes.new('ShaderNodeOutputMaterial'); p = nt.nodes.new('ShaderNodeBsdfPrincipled'); nt.links.new(p.outputs[0], out.inputs[0])
uv = nt.nodes.new('ShaderNodeUVMap'); uv.uv_map = 'UVMap'; t = nt.nodes.new('ShaderNodeTexImage'); t.image = IH; nt.links.new(uv.outputs[0], t.inputs['Vector'])
nt.links.new(t.outputs['Color'], p.inputs['Base Color']); r = nt.nodes.new('ShaderNodeMath'); r.operation = 'ROUND'; nt.links.new(t.outputs['Alpha'], r.inputs[0]); nt.links.new(r.outputs[0], p.inputs['Alpha'])
p.inputs['Roughness'].default_value = 0.6; p.inputs['Metallic'].default_value = 0.0; MH['burns_kind'] = 'hair'; MH.use_backface_culling = False
try: MH.surface_render_method = 'DITHERED'
except Exception: pass
SRC_KIND = {'M_KC_Skin': MS, 'M_KC_Cloth': MC, 'M_KC_Denim': MC, 'M_KC_Felt': MC, 'M_KC_Beard': MB}
meta = json.load(open(W + 'proj/kc_atlas_meta.json')); (su0, sv0), (su1, sv1) = meta['swatch']
def prep(ob, keep_uv):
    sel([ob])
    for md in list(ob.modifiers):
        if md.type != 'ARMATURE': bpy.ops.object.modifier_apply(modifier=md.name)
    me = ob.data; src = me.uv_layers[keep_uv]
    a = np.empty(len(me.loops) * 2, np.float32); src.data.foreach_get('uv', a)
    for u in list(me.uv_layers): me.uv_layers.remove(u)
    u = me.uv_layers.new(name='UVMap'); u.data.foreach_set('uv', a)
    for ca in list(me.color_attributes): me.color_attributes.remove(ca)
def dup(ob, name):
    for o in [o for o in bpy.data.objects if o.name == name]: bpy.data.objects.remove(o)
    n = ob.copy(); n.data = ob.data.copy(); n.name = name; n.data.name = name; coll.objects.link(n); n.parent = ob.parent; n.matrix_parent_inverse.identity(); n['kit_part'] = ob['kit_part'] if 'kit_part' in ob else ob.name
    return n
def decimate(ob, target):
    t = tris(ob)
    if t <= target: return
    sel([ob]); md = ob.modifiers.new('Dec', 'DECIMATE'); md.decimate_type = 'COLLAPSE'; md.ratio = max(0.02, target / t); md.use_collapse_triangulate = True
    bpy.ops.object.modifier_move_to_index(modifier='Dec', index=0); bpy.ops.object.modifier_apply(modifier='Dec')
def to_swatch(ob):
    me = ob.data; uvd = me.uv_layers['UVMap'].data; rng = np.random.default_rng(1)
    for i in range(len(uvd)): uvd[i].uv = (su0 + (su1 - su0) * (0.2 + 0.6 * rng.random()), sv0 + (sv1 - sv0) * (0.2 + 0.6 * rng.random()))
    me.materials.clear(); me.materials.append(MG)
# eyes join the kit under body names
for S in ('F', 'M'):
    for s in ('L', 'R'):
        e = bpy.data.objects.get('Cast%s_Eye_%s' % (S, s))
        if e: e.name = '%s_body_eye%s' % (S, s); e.data.name = e.name; e['kit_part'] = e.name
        if e and e.name not in coll.objects: coll.objects.link(e)
parts = [o for o in coll.objects if o.type == 'MESH' and o.name[:2] in ('F_', 'M_') and '_LOD' not in o.name]
for ob in parts:
    hair = '_hair_' in ob.name
    if hair:
        prep(ob, 'UVMap'); ob.data.materials.clear(); ob.data.materials.append(MH)
    else:
        src = ob.data.materials[0].name if ob.data.materials else ''
        prep(ob, 'Atlas'); ob.data.materials.clear(); ob.data.materials.append(SRC_KIND.get(src.rstrip('FM') if src.startswith('M_KC_Skin') else src, MG))
    for p_ in ob.data.polygons: p_.use_smooth = True
    limit_normalize(ob)
    for md in ob.modifiers:
        if md.type == 'ARMATURE': md.object = ob.parent
# the beard: off the upper cheeks and closer to the skin (it read as a mask)
for S in ('M',):
    bo = bpy.data.objects.get(S + '_face_beard')
    if bo:
        LMb = json.load(open(W + 'proj/cast%s_lm.json' % S.lower())); ez = LMb['eyeL'][2]
        bm = bmesh.new(); bm.from_mesh(bo.data)
        bmesh.ops.delete(bm, geom=[f for f in bm.faces if (lambda c: c.z > ez - 0.072 and abs(c.x) > 0.03)(f.calc_center_median())], context='FACES')
        bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
        bm.normal_update()
        for v in bm.verts: v.co -= v.normal * 0.0015
        bm.to_mesh(bo.data); bm.free()
# the (decimated) scalp sinks 7 mm under the hair caps (it poked through as a peak); hats sit 1.5 cm lower
for S in ('F', 'M'):
    LMh = json.load(open(W + 'proj/cast%s_lm.json' % S.lower())); ez = LMh['eyeL'][2]
    ho = bpy.data.objects.get(S + '_body_head')
    if ho:
        cy = sum(v.co.y for v in ho.data.vertices) / max(1, len(ho.data.vertices)); from mathutils import Vector as V3
        c = V3((0.0, cy, ez - 0.02))
        bmh = bmesh.new(); bmh.from_mesh(ho.data)
        scalp = [v for v in bmh.verts if v.co.z > ez + 0.04 and not v.is_boundary]
        for it in range(12): bmesh.ops.smooth_vert(bmh, verts=scalp, factor=0.5, use_axis_x=True, use_axis_y=True, use_axis_z=True)
        for v in scalp:
            k = min(1.0, max(0.0, (v.co.z - (ez + 0.045)) / 0.03))
            v.co -= (v.co - c).normalized() * 0.011 * k
        bmh.to_mesh(ho.data); bmh.free()
    for o in [o for o in bpy.data.objects if o.name.startswith(S + '_hat_') and '_LOD' not in o.name]:
        for v in o.data.vertices: v.co.z -= 0.015
# LOD0 trims after the atlas (collapse keeps the UVs): the head's face stays finer than the scalp and neck
TRIM = {'_body_head': 4200, '_body_eyeL': 160, '_body_eyeR': 160, '_hair_long': 3200, '_hair_bob': 2600}
for ob in parts:
    for k, tgt in TRIM.items():
        if ob.name.endswith(k) and tris(ob) > tgt:
            if k == '_body_head':
                g = ob.vertex_groups.get('__dec') or ob.vertex_groups.new(name='__dec')
                for v in ob.data.vertices:
                    x, y, z = v.co; g.add([v.index], 0.3 if y < -0.02 else 1.0, 'REPLACE')
                sel([ob]); md = ob.modifiers.new('Dec', 'DECIMATE'); md.decimate_type = 'COLLAPSE'; md.ratio = tgt / tris(ob); md.use_collapse_triangulate = True
                md.vertex_group = '__dec'; md.vertex_group_factor = 1.0
                bpy.ops.object.modifier_move_to_index(modifier='Dec', index=0); bpy.ops.object.modifier_apply(modifier='Dec'); ob.vertex_groups.remove(ob.vertex_groups['__dec'])
            else: decimate(ob, tgt)
            limit_normalize(ob)
# LODs
for ob in parts:
    t = tris(ob)
    if '_hair_' in ob.name:
        for L, keep in ((1, 2), (2, 4)):
            h = dup(ob, '%s_LOD%d' % (ob.name, L))
            bm = bmesh.new(); bm.from_mesh(h.data); uvl = bm.loops.layers.uv['UVMap']
            capf = [f for f in bm.faces if f.loops[0][uvl].uv.x < 0.5]; cards = [f for f in bm.faces if f.loops[0][uvl].uv.x >= 0.5]
            seen = set(); comps = []
            for f in cards:
                if f in seen: continue
                comp = []; st = [f]
                while st:
                    g = st.pop()
                    if g in seen: continue
                    seen.add(g); comp.append(g)
                    for e in g.edges:
                        for x in e.link_faces:
                            if x not in seen and x.loops[0][uvl].uv.x >= 0.5: st.append(x)
                comps.append(comp)
            kill = [f for i, c in enumerate(comps) if i % keep for f in c]
            bmesh.ops.delete(bm, geom=kill, context='FACES'); bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
            bm.to_mesh(h.data); bm.free()
            decimate(h, max(120, tris(h) // (2 if L == 1 else 3)))
            to_swatch(h); limit_normalize(h)
    else:
        for L, k in ((1, 0.38), (2, 0.14)):
            h = dup(ob, '%s_LOD%d' % (ob.name, L)); decimate(h, max(24, int(t * k))); limit_normalize(h)
# non-deforming end bones charkit's clips key (HeadTop_End, Left/RightToe_End), as cb_prepgame.py adds for Chinka
from mathutils import Vector
for X in ('F', 'M'):
    rig = bpy.data.objects['Arm' + X]; sel([rig]); bpy.ops.object.mode_set(mode='EDIT'); E = rig.data.edit_bones
    for name, parent, d in (('HeadTop_End', 'Head', Vector((0, 0, 0.04))), ('LeftToe_End', 'LeftToeBase', Vector((0, -0.03, 0))), ('RightToe_End', 'RightToeBase', Vector((0, -0.03, 0)))):
        b = E.get('mixamorig:' + name) or E.new('mixamorig:' + name); p_ = E['mixamorig:' + parent]
        b.head = p_.tail.copy(); b.tail = p_.tail + d; b.parent = p_; b.use_connect = False; b.use_deform = False
    bpy.ops.object.mode_set(mode='OBJECT')
print('kit parts', len(parts), 'objects', len([o for o in coll.objects if o.type == 'MESH']))
