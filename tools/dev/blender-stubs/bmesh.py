# Minimal stand-in for Blender's bmesh: builds real vertex positions and faces so scripts run and triangles can be
# counted. Booleans, bevels and normals are not modelled.
import math
from mathutils import Vector, Matrix

class BMVert:
    def __init__(s, co): s.co = Vector(co)
class BMFace:
    def __init__(s, verts): s.verts = list(verts); s.material_index = 0; s.smooth = True
    @property
    def normal(s):
        a, b, c = s.verts[0].co, s.verts[1].co, s.verts[2].co
        return (b - a).cross(c - a).normalized()
    def calc_center_median(s):
        c = Vector((0, 0, 0))
        for v in s.verts: c += v.co
        return c / len(s.verts)
class BMEdge:
    def __init__(s): s.smooth = True
class _Seq(list):
    def __init__(s, bm, kind): super().__init__(); s.bm = bm; s.kind = kind
    def new(s, a, *rest):
        if s.kind == 'v': o = BMVert(a)
        else:
            vs = list(a)
            if len(set(map(id, vs))) != len(vs) or len(vs) < 3: raise ValueError('bad face')
            key = frozenset(map(id, vs))
            if key in s.bm._fkeys: raise ValueError('face exists')
            s.bm._fkeys.add(key); o = BMFace(vs)
        s.append(o); return o
class BMesh:
    def __init__(s): s._fkeys = set(); s.verts = _Seq(s, 'v'); s.faces = _Seq(s, 'f')
    @property
    def edges(s): return [BMEdge() for _ in range(sum(len(f.verts) for f in s.faces) // 2)]
    def normal_update(s): pass
    def free(s): pass
    def to_mesh(s, me): me._bm = s
    def from_mesh(s, me):
        o = me._bm; mp = {}
        for v in o.verts: mp[id(v)] = s.verts.new(v.co)
        for f in o.faces:
            nf = s.faces.new([mp[id(v)] for v in f.verts]); nf.material_index = f.material_index
    def tris(s): return sum(len(f.verts) - 2 for f in s.faces)
def new(): return BMesh()

class ops:
    @staticmethod
    def transform(bm, matrix, verts):
        for v in verts: v.co = matrix @ v.co
    @staticmethod
    def translate(bm, verts, vec):
        for v in verts: v.co = v.co + Vector(vec)
    @staticmethod
    def reverse_faces(bm, faces):
        for f in faces: f.verts.reverse()
    @staticmethod
    def recalc_face_normals(bm, faces): pass
    @staticmethod
    def remove_doubles(bm, verts, dist):
        # weld coincident verts (only counts matter): rebuild faces on canonical verts
        canon = {}; mp = {}
        for v in verts:
            k = tuple(round(a / dist) for a in v.co)
            mp[id(v)] = canon.setdefault(k, v)
        keep = set(map(id, canon.values()))
        faces = list(bm.faces); bm.faces.clear(); bm._fkeys = set()
        for f in faces:
            vs = []
            for v in f.verts:
                c = mp.get(id(v), v)
                if c not in vs: vs.append(c)
            if len(vs) >= 3:
                try: bm.faces.new(vs).material_index = f.material_index
                except ValueError: pass
        bm.verts[:] = [v for v in bm.verts if id(v) in keep or id(v) not in mp]
    @staticmethod
    def split_edges(bm, edges): pass
    @staticmethod
    def create_cube(bm, size=1.0):
        h = size / 2; vs = [bm.verts.new((x * h, y * h, z * h)) for x in (-1, 1) for y in (-1, 1) for z in (-1, 1)]
        for q in ((0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)): bm.faces.new([vs[i] for i in q])
    @staticmethod
    def create_cone(bm, cap_ends=True, cap_tris=False, segments=8, radius1=1, radius2=1, depth=1):
        A = [bm.verts.new((math.cos(t) * radius1, math.sin(t) * radius1, -depth / 2)) for t in (math.tau * i / segments for i in range(segments))]
        if radius2 > 1e-9: B = [bm.verts.new((math.cos(t) * radius2, math.sin(t) * radius2, depth / 2)) for t in (math.tau * i / segments for i in range(segments))]
        else: B = [bm.verts.new((0, 0, depth / 2))] * segments
        for i in range(segments):
            j = (i + 1) % segments; vs = [A[i], A[j], B[j], B[i]]
            vs2 = []
            for v in vs:
                if v not in vs2: vs2.append(v)
            bm.faces.new(vs2)
        if cap_ends:
            bm.faces.new(A[::-1])
            if radius2 > 1e-9: bm.faces.new(B)
    @staticmethod
    def create_icosphere(bm, subdivisions=1, radius=1):
        n = 20 * 4 ** max(0, subdivisions - 1)
        for i in range(n):
            a = math.tau * i / n
            bm.faces.new([bm.verts.new((math.cos(a) * radius, math.sin(a) * radius, k * 0.01)) for k in range(3)])
    @staticmethod
    def create_uvsphere(bm, u_segments=8, v_segments=4, radius=1):
        rows = [[bm.verts.new((0, 0, radius))]]
        for i in range(1, v_segments):
            p = math.pi * i / v_segments
            rows.append([bm.verts.new((math.sin(p) * math.cos(t) * radius, math.sin(p) * math.sin(t) * radius, math.cos(p) * radius)) for t in (math.tau * j / u_segments for j in range(u_segments))])
        rows.append([bm.verts.new((0, 0, -radius))])
        for i in range(len(rows) - 1):
            A, B = rows[i], rows[i + 1]
            for j in range(u_segments):
                vs = []
                for v in (A[j % len(A)], B[j % len(B)], B[(j + 1) % len(B)], A[(j + 1) % len(A)]):
                    if v not in vs: vs.append(v)
                bm.faces.new(vs)
    @staticmethod
    def extrude_face_region(bm, geom):
        f = geom[0]; old = f.verts; new = [bm.verts.new(v.co) for v in old]
        n = len(old)
        for i in range(n): bm.faces.new([old[i], old[(i + 1) % n], new[(i + 1) % n], new[i]])
        bm.faces.new(new)
        return {'geom': new}
types = type('types', (), {'BMVert': BMVert, 'BMFace': BMFace})
