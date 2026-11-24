"""Realistic Chinka, step 7: one 'Atlas' UV layout for every opaque part (skin, eyes, gown, gold, LED beads, a hair
colour swatch for LOD2), islands scaled to a weighted texel density (face largest), packed; then a timer queue bakes
base colour, roughness, metallic (through an emission pass), tangent normal and AO at 2048 into
private/work/tex/ck_atlas/ and writes atlas_done.txt. (Generalised from realistic_brady/bl_atlas_uv.py + bl_bake_atlas.py.)
Run in the open Blender after cb_prepgame.py: exec(open(path).read()); poll for atlas_done.txt."""
import bpy, bmesh, numpy as np, math, os, json
W = '/Users/bradymott/brady-o/private/work/'
OUT = globals().get('ATLAS_OUT', W + 'tex/ck_atlas/'); os.makedirs(OUT, exist_ok=True)
META = globals().get('ATLAS_META', W + 'proj/ck_atlas_meta.json')
CFG = globals().get('ATLAS_CFG', {})
LM = json.load(open(W + 'proj/chinka_lm.json')) if 'ATLAS_OBJS' not in globals() else None
RES = CFG.get('res', 2048)
OPAQUE = globals().get('ATLAS_OBJS', ['Chinka_Body', 'Chinka_Eye_L', 'Chinka_Eye_R', 'CK_Bodice', 'CK_Belt', 'CK_Skirt', 'CK_Flats', 'CK_Gold', 'CK_Chain', 'CK_LED'])
def sel(objs, active=None):
    for o in bpy.context.view_layer.objects: o.select_set(False)
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = active or objs[0]
# smart UVs where a part has none worth keeping (jewellery: every bead/ring its own island)
for n in globals().get('SMART_UV', ('CK_Gold', 'CK_Chain', 'CK_LED')):
    ob = bpy.data.objects[n]; sel([ob])
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(60), island_margin=0.02)
    bpy.ops.object.mode_set(mode='OBJECT')
def island_weight_ck(obname, c):
    x, y, z = c
    if obname == 'Chinka_Body':
        if abs(x) < 0.035 and abs(z - LM['seam']) < 0.035 and y > LM['lipFront'][1] + 0.008: return 0.25   # inside the mouth
        if z > 1.44: return CFG.get('head', 2.6)
        if abs(x) > 0.16 and z > 1.2: return CFG.get('arm', 1.0)
        if z < 0.5: return CFG.get('shin', 0.45)
        return CFG.get('body', 0.85)
    if obname.startswith('Chinka_Eye'): return CFG.get('eye', 2.0)
    return {'CK_Bodice': 0.8, 'CK_Belt': 0.7, 'CK_Skirt': 0.42, 'CK_Flats': 0.4, 'CK_Gold': 0.55, 'CK_Chain': 0.35, 'CK_LED': 0.5}.get(obname, 0.5)
island_weight = globals().get('ATLAS_WEIGHT', island_weight_ck)
SWATCH = globals().get('SWATCH_NAME', 'AtlasSwatch')
sw = bpy.data.objects.get(SWATCH)
if sw is None:
    me = bpy.data.meshes.new(SWATCH); me.from_pydata([(0, 0, 3), (0.06, 0, 3), (0.06, 0, 3.06), (0, 0, 3.06)], [], [(0, 1, 2, 3)])
    me.uv_layers.new(name='UVMap')
    for i, l in enumerate(me.loops): me.uv_layers['UVMap'].data[i].uv = [(0, 0), (1, 0), (1, 1), (0, 1)][i]
    sw = bpy.data.objects.new(SWATCH, me); bpy.context.scene.collection.objects.link(sw)
    sw.data.materials.append(bpy.data.materials[globals().get('SWATCH_MAT', 'M_CK_Hair')])
objs = [bpy.data.objects[n] for n in OPAQUE] + [sw]
for ob in objs:
    me = ob.data
    if 'Atlas' in me.uv_layers: me.uv_layers.remove(me.uv_layers['Atlas'])
    src = me.uv_layers.get('UVMap') or me.uv_layers[0]
    if src.name != 'UVMap': src.name = 'UVMap'
    at = me.uv_layers.new(name='Atlas')
    a = np.empty(len(me.loops) * 2, np.float32); src.data.foreach_get('uv', a); at.data.foreach_set('uv', a)
    me.uv_layers.active = at
    bm = bmesh.new(); bm.from_mesh(me); uvl = bm.loops.layers.uv['Atlas']; bm.faces.ensure_lookup_table()
    par = list(range(len(bm.faces)))
    def f_(i):
        while par[i] != i: par[i] = par[par[i]]; i = par[i]
        return i
    for e in bm.edges:
        lf = e.link_loops
        if len(lf) != 2: continue
        l1, l2 = lf
        a1, b1 = l1[uvl].uv, l1.link_loop_next[uvl].uv; a2, b2 = l2.link_loop_next[uvl].uv, l2[uvl].uv
        if (a1 - a2).length < 1e-5 and (b1 - b2).length < 1e-5:
            r1, r2 = f_(l1.face.index), f_(l2.face.index)
            if r1 != r2: par[r1] = r2
    groups = {}
    for f in bm.faces: groups.setdefault(f_(f.index), []).append(f)
    for g in groups.values():
        a3 = sum(f.calc_area() for f in g); auv = 0.0
        for f in g:
            uv = [l[uvl].uv for l in f.loops]
            for i in range(1, len(uv) - 1):
                auv += abs((uv[i].x - uv[0].x) * (uv[i + 1].y - uv[0].y) - (uv[i + 1].x - uv[0].x) * (uv[i].y - uv[0].y)) / 2
        if auv < 1e-12 or a3 < 1e-12: continue
        c = sum((f.calc_center_median() for f in g), start=g[0].calc_center_median() * 0) / len(g)
        w = 1.2 if ob is sw else island_weight(ob.name, (c.x, c.y, c.z))
        k = math.sqrt(a3 / auv) * w
        cu = sum((l[uvl].uv for f in g for l in f.loops), start=g[0].loops[0][uvl].uv * 0) / sum(len(f.loops) for f in g)
        for f in g:
            for l in f.loops: l[uvl].uv = cu + (l[uvl].uv - cu) * k
    bm.to_mesh(me); bm.free()
sel(objs)
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.uv.select_all(action='SELECT')
bpy.ops.uv.pack_islands(udim_source='CLOSEST_UDIM', rotate=True, scale=True, merge_overlap=False, margin_method='FRACTION', margin=CFG.get('margin', 0.006), shape_method='CONCAVE')
bpy.ops.object.mode_set(mode='OBJECT')
U = np.array([d.uv[:] for d in sw.data.uv_layers['Atlas'].data])
json.dump({'swatch': [U.min(0).tolist(), U.max(0).tolist()]}, open(META, 'w'))

# ---------------- bake queue ----------------
sc = bpy.context.scene
try: sc.render.engine = 'CYCLES'
except TypeError: pass
try: sc.cycles.device = 'GPU'
except Exception: pass
for arm in [o for o in bpy.data.objects if o.type == 'ARMATURE']:
    if arm.animation_data: arm.animation_data.action = None
    for pb in arm.pose.bones: pb.rotation_quaternion = (1, 0, 0, 0); pb.location = (0, 0, 0)
mats = []
for ob in objs:
    me = ob.data; me.uv_layers.active = me.uv_layers['Atlas']
    me.uv_layers['UVMap'].active_render = True
    for s in ob.material_slots:
        if s.material and s.material not in mats: mats.append(s.material)
for m in mats:
    for x in m.node_tree.nodes:
        if x.type == 'NORMAL_MAP' and not x.uv_map: x.uv_map = 'UVMap'
        if x.type == 'TEX_IMAGE' and x.name != 'BAKE_TARGET' and not x.inputs['Vector'].is_linked:
            u = m.node_tree.nodes.new('ShaderNodeUVMap'); u.uv_map = 'UVMap'; m.node_tree.links.new(u.outputs['UV'], x.inputs['Vector'])
def target(job):
    name = 'CKATLAS_' + job
    im = bpy.data.images.get(name)
    if im is None or tuple(im.size) != (RES, RES):
        if im: bpy.data.images.remove(im)
        im = bpy.data.images.new(name, RES, RES, alpha=False, float_buffer=(job == 'normal'))
    im.colorspace_settings.name = 'sRGB' if job == 'base' else 'Non-Color'
    for m in mats:
        nt = m.node_tree
        nd = nt.nodes.get('BAKE_TARGET') or nt.nodes.new('ShaderNodeTexImage'); nd.name = 'BAKE_TARGET'; nd.image = im
        uvn = nt.nodes.get('BAKE_UV') or nt.nodes.new('ShaderNodeUVMap'); uvn.name = 'BAKE_UV'; uvn.uv_map = 'Atlas'
        if not nd.inputs['Vector'].is_linked: nt.links.new(uvn.outputs['UV'], nd.inputs['Vector'])
        for x in nt.nodes: x.select = False
        nd.select = True; nt.nodes.active = nd
    return im
def metal_swap(on):
    """route each material's Metallic into an Emission shader on the output (and back)"""
    for m in mats:
        nt = m.node_tree; out = next(n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL')
        p = next((n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'), None)
        if on:
            em = nt.nodes.get('BAKE_EMIT') or nt.nodes.new('ShaderNodeEmission'); em.name = 'BAKE_EMIT'
            m['_bake_out'] = out.inputs[0].links[0].from_socket.node.name if out.inputs[0].links else ''
            if p and p.inputs['Metallic'].links: nt.links.new(p.inputs['Metallic'].links[0].from_socket, em.inputs['Color'])
            else:
                v = p.inputs['Metallic'].default_value if p else 0.0
                for l in list(em.inputs['Color'].links): nt.links.remove(l)
                em.inputs['Color'].default_value = (v, v, v, 1)
            em.inputs['Strength'].default_value = 1.0
            nt.links.new(em.outputs[0], out.inputs[0])
        else:
            em = nt.nodes.get('BAKE_EMIT')
            if p: nt.links.new(p.outputs[0], out.inputs[0])
            if em: nt.nodes.remove(em)
def bake(job):
    im = target(job); sel(objs)
    b = sc.render.bake; b.margin = 16; b.margin_type = 'EXTEND'; b.use_clear = True; b.target = 'IMAGE_TEXTURES'; b.use_selected_to_active = False
    if job == 'base':       # Cycles' diffuse colour is zero for metal: bake with metallic off, then restore it
        sc.cycles.samples = 4; b.use_pass_direct = False; b.use_pass_indirect = False; b.use_pass_color = True
        saved = []
        for m in mats:
            p = next((n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
            if not p: continue
            src = p.inputs['Metallic'].links[0].from_socket if p.inputs['Metallic'].links else None
            saved.append((m, p, src, p.inputs['Metallic'].default_value))
            for l in list(p.inputs['Metallic'].links): m.node_tree.links.remove(l)
            p.inputs['Metallic'].default_value = 0.0
        try: bpy.ops.object.bake(type='DIFFUSE', pass_filter={'COLOR'})
        finally:
            for m, p, src, v in saved:
                p.inputs['Metallic'].default_value = v
                if src: m.node_tree.links.new(src, p.inputs['Metallic'])
    elif job == 'rough':
        sc.cycles.samples = 4; bpy.ops.object.bake(type='ROUGHNESS')
    elif job == 'metal':
        metal_swap(True); sc.cycles.samples = 4
        try: bpy.ops.object.bake(type='EMIT')
        finally: metal_swap(False)
    elif job == 'normal':
        sc.cycles.samples = 4; b.normal_space = 'TANGENT'; b.normal_r = 'POS_X'; b.normal_g = 'POS_Y'; b.normal_b = 'POS_Z'
        bpy.ops.object.bake(type='NORMAL')
    elif job == 'ao':
        sc.cycles.samples = 64
        if sc.world: sc.world.light_settings.distance = 0.2
        bpy.ops.object.bake(type='AO')
    if job == 'normal':      # 16-bit PNG, raw (atlas_post_ck.py reads it; no EXR needed)
        st = sc.render.image_settings; st.file_format = 'PNG'; st.color_depth = '16'; st.color_mode = 'RGB'
        try: st.color_management = 'OVERRIDE'; st.view_settings.view_transform = 'Raw'
        except Exception: pass
        im.save_render(OUT + 'atlas_normal.png', scene=sc)
    else: im.filepath_raw = OUT + 'atlas_%s.png' % job; im.file_format = 'PNG'; im.save()
    print('baked', job)
queue = list(CFG.get('jobs', ['base', 'rough', 'metal', 'normal', 'ao']))
def tick():
    if not queue:
        for m in mats:
            nt = m.node_tree
            for k in ('BAKE_TARGET', 'BAKE_UV'):
                if nt.nodes.get(k): nt.nodes.remove(nt.nodes[k])
        open(OUT + 'atlas_done.txt', 'w').write('ok'); return None
    try: bake(queue.pop(0))
    except Exception as e:
        open(OUT + 'atlas_done.txt', 'w').write('ERROR ' + repr(e)); return None
    return 0.2
if os.path.exists(OUT + 'atlas_done.txt'): os.remove(OUT + 'atlas_done.txt')
bpy.app.timers.register(tick, first_interval=0.5)
print('queued', queue, [m.name for m in mats])
