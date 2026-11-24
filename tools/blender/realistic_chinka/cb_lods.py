"""Realistic Chinka: LOD1 / LOD2 siblings (same armature, same materials). LOD1: opaque decimated to ~8 k, hair with
about half the cards and a lighter cap. LOD2 (one draw): opaque decimated to ~2.4 k plus the cap and every third card,
all mapped onto the hair-colour swatch of the body atlas (opaque), so it shares the body's texture set.
(Generalised from realistic_brady/bl_lods.py.)"""
import bpy, os, bmesh, numpy as np, json, random
exec(open('/private/tmp/claude-501/-Users-bradymott-brady-o/648391df-fe8b-4bf7-9824-1904f05c84e5/scratchpad/wt-cast-1/tools/blender/realistic_chinka/ck_util.py').read())
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
    sel([ob]); md = ob.modifiers.new('Dec', 'DECIMATE'); md.decimate_type = 'COLLAPSE'; md.ratio = min(1.0, ratio); md.use_collapse_triangulate = True
    bpy.ops.object.modifier_move_to_index(modifier='Dec', index=0); bpy.ops.object.modifier_apply(modifier='Dec')
def tris(ob): return sum(len(p.vertices) - 2 for p in ob.data.polygons)
def cleanup(ob):
    limit_normalize(ob)
CK = bpy.data.objects['Chinka']; HR = bpy.data.objects['Chinka_Hair']
def card_components(bm, uvl, pred):
    faces = [f for f in bm.faces if pred(f)]
    seen = set(); comps = []
    for f in faces:
        if f in seen: continue
        comp = []; st = [f]
        while st:
            g = st.pop()
            if g in seen: continue
            seen.add(g); comp.append(g)
            for e in g.edges:
                for h in e.link_faces:
                    if h not in seen and pred(h): st.append(h)
        comps.append(comp)
    return comps
is_card = lambda uvl: (lambda f: f.loops[0][uvl].uv.x >= 0.5 and f.loops[0][uvl].uv.y > 1 - 896 / 1024 - 0.01)
is_cap = lambda uvl: (lambda f: f.loops[0][uvl].uv.x < 0.5)
# ---- LOD1
b1 = dup(CK, 'Chinka_LOD1'); decimate(b1, L.get('body1', 8000) / tris(CK)); cleanup(b1)
h1 = dup(HR, 'Chinka_Hair_LOD1')
bm = bmesh.new(); bm.from_mesh(h1.data); uvl = bm.loops.layers.uv['UVMap']
random.seed(4); kill = []
for comp in card_components(bm, uvl, is_card(uvl)):
    if random.random() < L.get('card_drop', 0.45): kill += comp
bmesh.ops.delete(bm, geom=kill, context='FACES'); bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
bm.to_mesh(h1.data); bm.free(); cleanup(h1)
print('LOD1', tris(b1), tris(h1))
# ---- LOD2: one draw
meta = json.load(open('/Users/bradymott/brady-o/private/work/proj/ck_atlas_meta.json'))
(u0, v0), (u1, v1) = meta['swatch']
b2 = dup(CK, 'Chinka_LOD2'); decimate(b2, L.get('body2', 2400) / tris(CK))
c2 = dup(HR, 'Chinka_LOD2_hairtmp')
bm = bmesh.new(); bm.from_mesh(c2.data); uvl = bm.loops.layers.uv['UVMap']
keep = set()
for f in bm.faces:
    if is_cap(uvl)(f): keep.add(f)
for i, comp in enumerate(card_components(bm, uvl, is_card(uvl))):
    if i % 3 == 0:
        for f in comp: keep.add(f)
bmesh.ops.delete(bm, geom=[f for f in bm.faces if f not in keep], context='FACES')
bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
# cards become opaque: widen them a little so the silhouette keeps its mass
bm.to_mesh(c2.data); bm.free()
decimate(c2, L.get('hair2', 700) / max(tris(c2), 1))
me = c2.data; uvd = me.uv_layers['UVMap'].data; rng = np.random.default_rng(1)
for i in range(len(uvd)): uvd[i].uv = (u0 + (u1 - u0) * (0.2 + 0.6 * rng.random()), v0 + (v1 - v0) * (0.2 + 0.6 * rng.random()))
me.materials.clear(); me.materials.append(bpy.data.materials['M_CKG_Generic'])
for ca in list(me.color_attributes): me.color_attributes.remove(ca)
sel([b2, c2], b2); bpy.ops.object.join(); cleanup(b2)
for p in b2.data.polygons: p.use_smooth = True
print('LOD2', tris(b2), [s.material.name for s in b2.material_slots])
for ob in (b1, h1, b2):
    for md in ob.modifiers:
        if md.type == 'ARMATURE': md.object = arm
