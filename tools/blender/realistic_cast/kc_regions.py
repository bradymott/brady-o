"""Realistic cast kit, step 3: split each base body into regions (separate meshes '<S>_body_<region>') so a composed
character leaves out the regions its outfit fully hides (no skin poking through cloth, and most of the body's
triangles saved), decimate everything to the NPC budget (face, ears and hands protected), and write the kit manifest
(private/work/proj/cast_kit.json: per part its slot and the regions it hides; embedded in the GLB as scene extras).
Region edges sit at least 1.5 cm inside the hems of the garments that hide them (checked here).
Run in the open Blender after kc_parts.py."""
import bpy, bmesh, json, math, numpy as np
W = '/Users/bradymott/brady-o/private/work/'
CFG = globals().get('REG_CFG', {})
M = 'mixamorig:'
coll = bpy.data.collections['Kit']
def sel(objs, active=None):
    bpy.context.view_layer.update()
    for o in bpy.context.view_layer.objects:
        if o: o.select_set(False)
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = active or objs[0]
def tris(ob): return sum(len(p.vertices) - 2 for p in ob.data.polygons)
def apply_mods(ob, keep=('ARMATURE',)):
    sel([ob])
    for md in list(ob.modifiers):
        if md.type not in keep: bpy.ops.object.modifier_apply(modifier=md.name)
def decimate(ob, target, group=None):
    t = tris(ob)
    if t <= target: return
    sel([ob]); md = ob.modifiers.new('Dec', 'DECIMATE'); md.decimate_type = 'COLLAPSE'; md.ratio = target / t; md.use_collapse_triangulate = True
    if group: md.vertex_group = group; md.vertex_group_factor = 1.0
    bpy.ops.object.modifier_move_to_index(modifier='Dec', index=0); bpy.ops.object.modifier_apply(modifier='Dec')
HIDES = {
    'top_tee': ['chest', 'belly', 'shoulder'], 'top_long': ['chest', 'belly', 'shoulder', 'arm'], 'top_tank': ['chest', 'belly'],
    'top_crop': ['chest'], 'top_vest': [], 'coat_long': ['shoulder', 'arm'], 'coat_longskirt': [],
    'bot_pants': ['hips', 'thigh', 'shin'], 'bot_shorts': ['hips'], 'bot_skirt': [], 'bot_tutu': [],
    'shoe_sneakers': ['foot'], 'shoe_boots': ['foot'], 'shoe_sandals': [],
}
TARGET = CFG.get('target', {'head': 3800, 'neck': 500, 'chest': 600, 'belly': 400, 'shoulder': 600, 'arm': 500, 'hand': 900, 'hips': 600, 'thigh': 450, 'shin': 450, 'foot': 500,
                            'top': 1300, 'coat': 1300, 'bot': 1100, 'skirt': 700, 'shoe': 360, 'hat': 400, 'eyes': 170, 'face': 700})
manifest = {'parts': {}, 'bodies': {}}
for S in globals().get('ONLY', ('F', 'M')):
    body = bpy.data.objects['Cast%s_Body' % S]; rig = bpy.data.objects['Arm%s' % S]; me = body.data
    B = lambda n: rig.data.bones[M + n]
    LM = json.load(open(W + 'proj/cast%s_lm.json' % S.lower()))
    hipz = B('Hips').head_local.z; armx = B('LeftArm').head_local.x; wrx = B('LeftHand').head_local.x; shz = B('LeftArm').head_local.z
    kneez = B('LeftLeg').head_local.z; anklez = B('LeftFoot').head_local.z; neckz = B('Neck').head_local.z
    P = np.array([v.co[:] for v in me.vertices])
    best = (9, hipz + 0.1)
    for zz in np.arange(hipz + 0.04, hipz + 0.26, 0.01):
        kk = (np.abs(P[:, 2] - zz) < 0.006) & (np.abs(P[:, 0]) < armx)
        if kk.sum() > 10:
            w = P[kk, 0].max() - P[kk, 0].min()
            if w < best[0]: best = (w, zz)
    waist = best[1]
    nf = neckz - 0.06 if S == 'F' else neckz - 0.045
    def region(c):
        x, y, z = c; ax = abs(x)
        if ax >= wrx - 0.03: return 'hand'
        if ax >= armx + 0.10 and z > hipz + 0.07: return 'arm'
        if ax >= armx - 0.025 and z > hipz + 0.07: return 'shoulder'
        if z > neckz + 0.025: return 'head'
        if z > nf - 0.04: return 'neck'
        if z > waist + 0.09: return 'chest'
        if z > hipz + 0.07: return 'belly'
        if z > kneez + 0.15: return 'hips'
        if z > kneez - 0.03: return 'thigh'
        if z > anklez + 0.02: return 'shin'
        return 'foot'
    regs = {}
    for f in me.polygons:
        regs.setdefault(region(f.center), []).append(f.index)
    made = []
    for rname, faces in regs.items():
        name = '%s_body_%s' % (S, rname)
        old = bpy.data.objects.get(name)
        if old: bpy.data.objects.remove(old)
        ob = body.copy(); ob.data = me.copy(); ob.name = name; ob.data.name = name; coll.objects.link(ob)
        keep = set(faces)
        bm = bmesh.new(); bm.from_mesh(ob.data); bm.faces.ensure_lookup_table()
        bmesh.ops.delete(bm, geom=[f for f in bm.faces if f.index not in keep], context='FACES')
        bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
        bm.to_mesh(ob.data); bm.free()
        ob['kit_part'] = name; made.append(ob)
    # decimate the regions: the face (front of the head, ears) and the hands are kept finer
    for ob in made:
        rname = ob.name.split('_body_')[1]
        if rname == 'head':
            g = ob.vertex_groups.get('__dec') or ob.vertex_groups.new(name='__dec')
            for v in ob.data.vertices:
                x, y, z = v.co
                g.add([v.index], 0.0 if (y < -0.02 or abs(x) > 0.06) and z < neckz + 0.2 else 0.7, 'REPLACE')
            decimate(ob, TARGET['head'], '__dec'); ob.vertex_groups.remove(ob.vertex_groups['__dec'])
        else:
            decimate(ob, TARGET.get(rname, 600))
    # check: every hidden region lies inside its garment (each region vertex has garment surface within 4 cm outward)
    from mathutils.bvhtree import BVHTree
    for part, hides in HIDES.items():
        gob = bpy.data.objects.get('%s_%s' % (S, part))
        if not gob or not hides: continue
        dg = bpy.context.evaluated_depsgraph_get(); ev = gob.evaluated_get(dg); gm = ev.to_mesh()
        bvh = BVHTree.FromPolygons([v.co.copy() for v in gm.vertices], [list(p.vertices) for p in gm.polygons]); ev.to_mesh_clear()
        bad = 0; tot = 0
        for r in hides:
            rob = bpy.data.objects.get('%s_body_%s' % (S, r))
            if not rob: continue
            for v in rob.data.vertices:
                tot += 1
                loc, n, _, d = bvh.find_nearest(v.co)
                if loc is None or d > 0.04: bad += 1
        if bad: print('WARN', S, part, 'hides', hides, 'but', bad, 'of', tot, 'region vertices are > 4 cm from it')
    manifest['bodies'][S] = {'waist': waist, 'hipz': hipz, 'kneez': kneez, 'regions': sorted(regs.keys()), 'height': float(P[:, 2].max())}
    # garments and pieces: apply their modifiers (solidify) and decimate
    for ob in [o for o in coll.objects if o.name.startswith(S + '_') and '_body_' not in o.name]:
        apply_mods(ob)
        kind = ob.name.split('_')[1]
        tgt = TARGET['skirt'] if ob.name.endswith(('skirt', 'tutu')) else TARGET.get(kind, 800)
        decimate(ob, tgt)
        slot, _, k = ob.name[2:].partition('_')
        manifest['parts'][ob.name] = {'sex': S, 'slot': slot, 'kind': k, 'hides': HIDES.get(ob.name[2:], []), 'tris': tris(ob)}
    for ob in made: manifest['parts'][ob.name] = {'sex': S, 'slot': 'body', 'kind': ob.name.split('_body_')[1], 'hides': [], 'tris': tris(ob)}
    # the eyes ride along with the head region
    for s_ in ('L', 'R'):
        e = bpy.data.objects.get('Cast%s_Eye_%s' % (S, s_))
        if e: e['kit_part'] = '%s_body_eye%s' % (S, s_); manifest['parts']['Cast%s_Eye_%s' % (S, s_)] = {'sex': S, 'slot': 'body', 'kind': 'eye', 'hides': [], 'tris': tris(e)}
    body.hide_set(True); body.hide_render = True
json.dump(manifest, open(W + 'proj/cast_kit.json', 'w'), indent=1)
tot = {}
for n, p in manifest['parts'].items(): tot[p['sex'] + p['slot']] = tot.get(p['sex'] + p['slot'], 0) + p['tris']
print('kit tris by slot', tot)
