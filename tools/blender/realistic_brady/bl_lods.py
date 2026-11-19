"""LOD1 / LOD2 siblings of Brady and Brady_Hair (same armature, same materials)."""
import bpy, bmesh, numpy as np, json, random
arm = bpy.data.objects['Armature']
L = globals().get('LOD_CFG', {})
def sel(objs, active=None):
    for o in bpy.context.view_layer.objects: o.select_set(False)
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = active or objs[0]
def dup(ob, name):
    for o in [o for o in bpy.data.objects if o.name == name]: bpy.data.objects.remove(o)
    n = ob.copy(); n.data = ob.data.copy(); n.name = name; n.data.name = name
    bpy.context.scene.collection.objects.link(n); n.parent = arm; n.matrix_parent_inverse.identity()
    return n
def decimate(ob, ratio):
    sel([ob]); md = ob.modifiers.new('Dec', 'DECIMATE'); md.decimate_type = 'COLLAPSE'; md.ratio = ratio
    md.use_collapse_triangulate = True
    bpy.ops.object.modifier_move_to_index(modifier='Dec', index=0); bpy.ops.object.modifier_apply(modifier='Dec')
def tris(ob): return sum(len(p.vertices) - 2 for p in ob.data.polygons)
def cleanup(ob):
    sel([ob]); bpy.ops.object.vertex_group_clean(group_select_mode='ALL', limit=0.001)
    bpy.ops.object.vertex_group_limit_total(group_select_mode='ALL', limit=4)
    bpy.ops.object.vertex_group_normalize_all(lock_active=False)
BR = bpy.data.objects['Brady']; HR = bpy.data.objects['Brady_Hair']
# ---- LOD1
b1 = dup(BR, 'Brady_LOD1'); decimate(b1, L.get('body1', 8000) / tris(BR)); cleanup(b1)
h1 = dup(HR, 'Brady_Hair_LOD1')
bm = bmesh.new(); bm.from_mesh(h1.data); uvl = bm.loops.layers.uv['UVMap']
cap = [f for f in bm.faces if f.loops[0][uvl].uv.x < 0.5]
cards = [f for f in bm.faces if f.loops[0][uvl].uv.x >= 0.5]
# thin the cards: drop ~45 % of the connected card pieces (bun core and lashes kept: the large pieces)
seen = set(); comps = []
for f in cards:
    if f in seen: continue
    comp = []; st = [f]
    while st:
        g = st.pop()
        if g in seen: continue
        seen.add(g); comp.append(g)
        for e in g.edges:
            for h in e.link_faces:
                if h not in seen: st.append(h)
    comps.append(comp)
random.seed(4); kill = []
for comp in comps:
    if len(comp) <= 8 and random.random() < L.get('card_drop', 0.45): kill += comp
bmesh.ops.delete(bm, geom=kill, context='FACES')
bm.to_mesh(h1.data); bm.free()
# decimate only the cap part: split, decimate, rejoin
sel([h1]); bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='DESELECT'); bpy.ops.object.mode_set(mode='OBJECT')
uv = h1.data.uv_layers['UVMap'].data
for p in h1.data.polygons: p.select = uv[p.loop_indices[0]].uv.x < 0.5
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.separate(type='SELECTED'); bpy.ops.object.mode_set(mode='OBJECT')
capo = [o for o in bpy.context.selected_objects if o is not h1][0]
decimate(capo, L.get('cap1', 1100) / max(tris(capo), 1))
sel([h1, capo], h1); bpy.ops.object.join(); cleanup(h1)
print('LOD1', tris(b1), tris(h1))
# ---- LOD2: one draw: body decimated + cap (and a small bun) mapped to the hair swatch of the body atlas
meta = json.load(open('/Users/bradymott/brady-o/private/work/proj/atlas_meta.json'))
(u0, v0), (u1, v1) = meta['swatch']
b2 = dup(BR, 'Brady_LOD2'); decimate(b2, L.get('body2', 2600) / tris(BR))
c2 = dup(HR, 'Brady_LOD2_hairtmp')
sel([c2]); bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='DESELECT'); bpy.ops.object.mode_set(mode='OBJECT')
uv = c2.data.uv_layers['UVMap'].data
for p in c2.data.polygons: p.select = uv[p.loop_indices[0]].uv.x >= 0.5
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.delete(type='FACE'); bpy.ops.object.mode_set(mode='OBJECT')
decimate(c2, L.get('cap2', 420) / max(tris(c2), 1))
# bun: a low icosphere at the bun
bm = bmesh.new(); bmesh.ops.create_icosphere(bm, subdivisions=2, radius=1.0)
for v in bm.verts: v.co = v.co * 0 + type(v.co)((v.co.x * 0.05, v.co.y * 0.054 + 0.062, v.co.z * 0.042 + 1.895))
bun = bpy.data.meshes.new('lod2bun'); bm.to_mesh(bun); bm.free()
bo = bpy.data.objects.new('lod2bun', bun); bpy.context.scene.collection.objects.link(bo); bo.parent = arm
bun.uv_layers.new(name='UVMap'); bo.vertex_groups.new(name='mixamorig:Head').add(list(range(len(bun.vertices))), 1.0, 'REPLACE')
bo.modifiers.new('Armature', 'ARMATURE').object = arm
for ob in (c2, bo):
    me = ob.data; uvd = me.uv_layers['UVMap'].data
    rng = np.random.default_rng(1)
    for i in range(len(uvd)): uvd[i].uv = (u0 + (u1 - u0) * (0.2 + 0.6 * rng.random()), v0 + (v1 - v0) * (0.2 + 0.6 * rng.random()))
    me.materials.clear(); me.materials.append(bpy.data.materials['M_BradyRB_Generic'])
    for ca in list(me.color_attributes): me.color_attributes.remove(ca)
    ob['burns_part'] = 'hair'
sel([b2, c2, bo], b2); bpy.ops.object.join(); cleanup(b2)
for p in b2.data.polygons: p.use_smooth = True
# LOD2 must be one draw: every material there must share the body texture set (they do) -> also make them one material
print('LOD2', tris(b2), [s.material.name for s in b2.material_slots])
for ob in (b1, h1, b2):
    for md in ob.modifiers:
        if md.type == 'ARMATURE': md.object = arm
print('done')
