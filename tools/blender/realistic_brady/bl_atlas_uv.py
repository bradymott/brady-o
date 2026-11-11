"""One 'Atlas' UV layout for every opaque part (body, clothes, eyes, glasses, hair tie) plus a reserved hair swatch
island (LOD2 hair). Islands are first scaled to a uniform texel density, then weighted (face large, tattooed arms
larger, clothes and small parts smaller), then packed together."""
import bpy, bmesh, numpy as np, math
OPAQUE = globals().get('ATLAS_OBJS', ['Brady_Body', 'Tee', 'Trousers', 'Sneakers', 'Brady_Eye_L', 'Brady_Eye_R',
                                      'Sunglasses_Frame', 'Sunglasses_Lenses', 'Sunglasses_Temples', 'Hair_Tie'])
WEIGHT = globals().get('ATLAS_W', {})
def island_weight(obname, c):
    x, y, z = c
    if obname == 'Brady_Body':
        if z > 1.6: return WEIGHT.get('head', 2.4)
        if abs(x) > 0.3 and abs(x) < 0.66 and z > 1.35: return WEIGHT.get('arm', 1.35)
        return WEIGHT.get('body', 1.0)
    if obname.startswith('Brady_Eye'): return WEIGHT.get('eye', 2.2)
    if obname in ('Tee', 'Trousers'): return WEIGHT.get('cloth', 0.62)
    if obname == 'Sneakers': return WEIGHT.get('shoe', 0.7)
    if obname.startswith('Sunglasses'): return WEIGHT.get('glasses', 0.6)
    return WEIGHT.get('small', 0.4)
# swatch object (a 6 x 6 cm quad) for the LOD2 hair colour
sw = bpy.data.objects.get('AtlasSwatch')
if sw is None:
    me = bpy.data.meshes.new('AtlasSwatch'); me.from_pydata([(0, 0, 3), (0.06, 0, 3), (0.06, 0, 3.06), (0, 0, 3.06)], [], [(0, 1, 2, 3)])
    me.uv_layers.new(name='UVMap')
    for i, l in enumerate(me.loops): me.uv_layers['UVMap'].data[i].uv = [(0, 0), (1, 0), (1, 1), (0, 1)][i]
    sw = bpy.data.objects.new('AtlasSwatch', me); bpy.context.scene.collection.objects.link(sw)
objs = [bpy.data.objects[n] for n in OPAQUE] + [sw]
for ob in objs:
    me = ob.data
    if 'Atlas' in me.uv_layers: me.uv_layers.remove(me.uv_layers['Atlas'])
    src = me.uv_layers.get('UVMap') or me.uv_layers[0]
    at = me.uv_layers.new(name='Atlas')
    a = np.empty(len(me.loops) * 2, np.float32); src.data.foreach_get('uv', a); at.data.foreach_set('uv', a)
    me.uv_layers.active = at
    # islands: union-find over faces sharing an edge with matching UVs
    bm = bmesh.new(); bm.from_mesh(me); uvl = bm.loops.layers.uv['Atlas']; bm.faces.ensure_lookup_table()
    par = list(range(len(bm.faces)))
    def f_(i):
        while par[i] != i: par[i] = par[par[i]]; i = par[i]
        return i
    for e in bm.edges:
        lf = e.link_loops
        if len(lf) != 2: continue
        l1, l2 = lf
        # same uv at both ends of the edge on both sides
        a1, b1 = l1[uvl].uv, l1.link_loop_next[uvl].uv
        a2, b2 = l2.link_loop_next[uvl].uv, l2[uvl].uv
        if (a1 - a2).length < 1e-5 and (b1 - b2).length < 1e-5:
            r1, r2 = f_(l1.face.index), f_(l2.face.index)
            if r1 != r2: par[r1] = r2
    groups = {}
    for f in bm.faces: groups.setdefault(f_(f.index), []).append(f)
    sw_scale = globals().get('SWATCH_SCALE', 1.0)
    for g in groups.values():
        a3 = sum(f.calc_area() for f in g)
        auv = 0.0
        for f in g:
            uv = [l[uvl].uv for l in f.loops]
            for i in range(1, len(uv) - 1):
                auv += abs((uv[i].x - uv[0].x) * (uv[i + 1].y - uv[0].y) - (uv[i + 1].x - uv[0].x) * (uv[i].y - uv[0].y)) / 2
        if auv < 1e-12 or a3 < 1e-12: continue
        c = sum((f.calc_center_median() for f in g), start=g[0].calc_center_median() * 0) / len(g)
        w = sw_scale * 1.2 if ob is sw else island_weight(ob.name, (c.x, c.y, c.z))
        k = math.sqrt(a3 / auv) * w
        cu = sum((l[uvl].uv for f in g for l in f.loops), start=g[0].loops[0][uvl].uv * 0) / sum(len(f.loops) for f in g)
        for f in g:
            for l in f.loops: l[uvl].uv = cu + (l[uvl].uv - cu) * k
    bm.to_mesh(me); bm.free()
    print(ob.name, len(groups), 'islands')
for o in bpy.context.view_layer.objects: o.select_set(False)
for ob in objs: ob.select_set(True)
bpy.context.view_layer.objects.active = objs[0]
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.uv.select_all(action='SELECT')
bpy.ops.uv.pack_islands(udim_source='CLOSEST_UDIM', rotate=True, scale=True, merge_overlap=False,
                        margin_method='FRACTION', margin=globals().get('ATLAS_MARGIN', 0.006), shape_method='CONCAVE')
bpy.ops.object.mode_set(mode='OBJECT')
uv = sw.data.uv_layers['Atlas'].data
U = np.array([d.uv[:] for d in uv]); print('swatch', U.min(0), U.max(0))
import json; json.dump({'swatch': [U.min(0).tolist(), U.max(0).tolist()]}, open('/Users/bradymott/brady-o/private/work/proj/atlas_meta.json', 'w'))
