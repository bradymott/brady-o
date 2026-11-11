# Minimal stand-in for bpy: enough for tools/blender/cartkit.py Build + a car's build(B) to run (no export, no render).
class _Props(dict):
    def __getattr__(s, k):
        try: return s[k]
        except KeyError: raise AttributeError(k)
    def __setattr__(s, k, v): s[k] = v
class _Input:
    def __init__(s): s.default_value = 0
class _Inputs(dict):
    def __missing__(s, k): v = _Input(); s[k] = v; return v
class _Node:
    def __init__(s, t): s.type = t; s.inputs = _Inputs()
class _Mat(dict):
    def __init__(s, name): super().__init__(); s.name = name; s.use_nodes = False; s.node_tree = _Props(nodes=[_Node('BSDF_PRINCIPLED'), _Node('OUTPUT_MATERIAL')]); s.diffuse_color = None
    __hash__ = object.__hash__
    __eq__ = object.__eq__
    __ne__ = object.__ne__
    def __bool__(s): return True
class _Coll(dict):
    def __init__(s, factory): super().__init__(); s.f = factory
    def new(s, name, *a): o = s.f(name, *a); s[name + str(len(s))] = o; return o
    def get(s, name): return None
    def remove(s, o): pass
    def __iter__(s): return iter(list(s.values()))
class _Attr:
    def __init__(s, n): s.data = [_Props(color=(1, 1, 1, 1)) for _ in range(n)]
class _ColorAttrs:
    def __init__(s, me): s.me = me; s.items = {}
    def new(s, name, t, dom): a = _Attr(len(s.me.vertices)); s.items[name] = a; return a
    def find(s, name): return list(s.items).index(name)
class _Mesh:
    def __init__(s, name): s.name = name; s._bm = None; s.materials = []; s.color_attributes = _ColorAttrs(s)
    @property
    def polygons(s): return [_Props(use_smooth=True) for _ in (s._bm.faces if s._bm else [])]
    @property
    def vertices(s): return s._bm.verts if s._bm else []
class _Mods(list):
    def new(s, name, t): m = _Props(name=name, type=t); s.append(m); return m
    def find(s, name): return [m.name for m in s].index(name)
    def move(s, a, b): s.insert(b, s.pop(a))
class _Obj(dict):
    def __init__(s, name, data): super().__init__(); s.name = name; s.data = data; s.type = 'MESH' if data is not None else 'EMPTY'; s.parent = None; s.modifiers = _Mods(); s.location = None
    __hash__ = object.__hash__
    __eq__ = object.__eq__
    __ne__ = object.__ne__
    def __bool__(s): return True
    def hide_set(s, v): pass
    def select_set(s, v): pass
class _Collection:
    def __init__(s, name): s.name = name; s.objects = []; s.children = _Props(link=lambda c: None)
    @property
    def objects_link(s): return s.objects.append
_col = _Collection
def _mkcol(name):
    c = _Collection(name); c.objects = _Props(link=lambda o, c=c: c.__dict__.setdefault('_objs', []).append(o)); return c
class data:
    materials = _Coll(lambda n: _Mat(n))
    meshes = _Coll(lambda n: _Mesh(n))
    objects = _Coll(lambda n, d=None: _Obj(n, d))
    collections = _Coll(_mkcol)
class context:
    scene = _Props(collection=_Props(children=_Props(link=lambda c: None)))
    view_layer = _Props(objects=_Props(active=None))
    object = None
