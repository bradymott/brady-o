"""Shared helpers for the realistic Chinka scripts (exec'd by them)."""
def limit_normalize(ob, k=4, eps=0.001):
    """Rebuild ob's vertex groups from its valid deform weights: each vertex keeps its k strongest weights above eps,
    normalised. Pure Python, and it drops stray weight entries whose group index is invalid (seen after joins here;
    Blender 5.2.3's vertex_group_normalize_all operator crashed on them)."""
    me = ob.data; names = {g.index: g.name for g in ob.vertex_groups}
    per = []
    for v in me.vertices:
        gs = sorted(((names[g.group], g.weight) for g in v.groups if g.group in names and g.weight > eps and names[g.group].startswith('mixamorig:')), key=lambda a: -a[1])[:k]
        tot = sum(w for _, w in gs)
        per.append([(n, w / tot) for n, w in gs] if tot > 0 else [])
    order = [g.name for g in ob.vertex_groups if g.name.startswith('mixamorig:')]
    ob.vertex_groups.clear()
    G = {n: ob.vertex_groups.new(name=n) for n in order}
    buckets = {}
    for i, gs in enumerate(per):
        for n, w in gs: buckets.setdefault((n, round(w, 5)), []).append(i)
    for (n, w), ids in buckets.items(): G[n].add(ids, w, 'REPLACE')
    bad = sum(1 for gs in per if not gs)
    if bad: print('WARN', ob.name, bad, 'vertices without weights')
