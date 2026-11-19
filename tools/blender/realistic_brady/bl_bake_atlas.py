"""Bake every opaque part's look (base colour, roughness, tangent normal, AO) into the shared 'Atlas' UV layout,
2048 px, saved as float-free PNGs into private/work/tex/atlas/. Runs as a timer queue (one bake a tick) and writes
atlas_done.txt when finished."""
import bpy, os, json
OUT = '/Users/bradymott/brady-o/private/work/tex/atlas/'
os.makedirs(OUT, exist_ok=True)
OBJS = ['Brady_Body', 'Tee', 'Trousers', 'Sneakers', 'Brady_Eye_L', 'Brady_Eye_R', 'Sunglasses_Frame', 'Sunglasses_Lenses',
        'Sunglasses_Temples', 'Hair_Tie']
RES = globals().get('BAKE_RES', 2048)
JOBS = globals().get('BAKE_JOBS', ['base', 'rough', 'normal', 'ao'])
sc = bpy.context.scene
sc.render.engine = 'CYCLES'
try: sc.cycles.device = 'GPU'
except Exception: pass
arm = bpy.data.objects['Armature']
if arm.animation_data: arm.animation_data.action = None
for pb in arm.pose.bones: pb.rotation_quaternion = (1, 0, 0, 0); pb.location = (0, 0, 0)
mats = []
for n in OBJS:
    ob = bpy.data.objects[n]; me = ob.data
    me.uv_layers.active = me.uv_layers['Atlas']
    src = me.uv_layers.get('UVMap')
    if src: src.active_render = True
    for s in ob.material_slots:
        if s.material and s.material not in mats: mats.append(s.material)
for m in mats:
    for x in m.node_tree.nodes:
        if x.type == 'NORMAL_MAP' and not x.uv_map: x.uv_map = 'UVMap'
        if x.type == 'TEX_IMAGE' and x.name != 'BAKE_TARGET' and not x.inputs['Vector'].is_linked:
            u = m.node_tree.nodes.new('ShaderNodeUVMap'); u.uv_map = 'UVMap'; m.node_tree.links.new(u.outputs['UV'], x.inputs['Vector'])
imgs = {}
def target(job):
    name = 'ATLAS_' + job
    im = bpy.data.images.get(name)
    if im is None or tuple(im.size) != (RES, RES):
        if im: bpy.data.images.remove(im)
        im = bpy.data.images.new(name, RES, RES, alpha=False, float_buffer=(job == 'normal'))
    im.colorspace_settings.name = 'sRGB' if job == 'base' else 'Non-Color'
    for m in mats:
        nt = m.node_tree
        nd = nt.nodes.get('BAKE_TARGET') or nt.nodes.new('ShaderNodeTexImage')
        nd.name = 'BAKE_TARGET'; nd.image = im
        # a UV map node pins the target to the Atlas layout
        uvn = nt.nodes.get('BAKE_UV') or nt.nodes.new('ShaderNodeUVMap'); uvn.name = 'BAKE_UV'; uvn.uv_map = 'Atlas'
        if not nd.inputs['Vector'].is_linked: nt.links.new(uvn.outputs['UV'], nd.inputs['Vector'])
        for x in nt.nodes: x.select = False
        nd.select = True; nt.nodes.active = nd
    return im
def select():
    for o in bpy.context.view_layer.objects: o.select_set(False)
    for n in OBJS: bpy.data.objects[n].select_set(True)
    bpy.context.view_layer.objects.active = bpy.data.objects[OBJS[0]]
def bake(job):
    im = target(job); select()
    b = sc.render.bake; b.margin = 16; b.margin_type = 'EXTEND'; b.use_clear = True; b.target = 'IMAGE_TEXTURES'
    b.use_selected_to_active = False
    if job == 'base':
        sc.cycles.samples = 4; b.use_pass_direct = False; b.use_pass_indirect = False; b.use_pass_color = True
        bpy.ops.object.bake(type='DIFFUSE', pass_filter={'COLOR'})
    elif job == 'rough':
        sc.cycles.samples = 4; bpy.ops.object.bake(type='ROUGHNESS')
    elif job == 'normal':
        sc.cycles.samples = 4; b.normal_space = 'TANGENT'; b.normal_r = 'POS_X'; b.normal_g = 'POS_Y'; b.normal_b = 'POS_Z'
        bpy.ops.object.bake(type='NORMAL')
    elif job == 'ao':
        sc.cycles.samples = 96
        if sc.world: sc.world.light_settings.distance = 0.25
        bpy.ops.object.bake(type='AO')
    im.filepath_raw = OUT + 'atlas_%s.png' % job; im.file_format = 'PNG'
    if job == 'normal':
        im.filepath_raw = OUT + 'atlas_normal.exr'; im.file_format = 'OPEN_EXR'
    im.save()
    print('baked', job)
queue = list(JOBS)
def tick():
    if not queue:
        for m in mats:
            nt = m.node_tree
            for k in ('BAKE_TARGET', 'BAKE_UV'):
                if nt.nodes.get(k): nt.nodes.remove(nt.nodes[k])
        open(OUT + 'atlas_done.txt', 'w').write('ok')
        return None
    bake(queue.pop(0)); return 0.2
if os.path.exists(OUT + 'atlas_done.txt'): os.remove(OUT + 'atlas_done.txt')
bpy.app.timers.register(tick, first_interval=0.3)
print('queued', JOBS, [m.name for m in mats])
