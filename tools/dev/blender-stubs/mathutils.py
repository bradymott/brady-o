# Minimal pure-Python stand-in for Blender's mathutils (dry runs of the car scripts only).
import math

class Vector:
    def __init__(self, v=(0, 0, 0)): self.v = [float(a) for a in v]
    def __len__(self): return len(self.v)
    def __iter__(self): return iter(self.v)
    def __getitem__(self, i): return self.v[i]
    def __setitem__(self, i, a): self.v[i] = float(a)
    x = property(lambda s: s.v[0], lambda s, a: s.__setitem__(0, a))
    y = property(lambda s: s.v[1], lambda s, a: s.__setitem__(1, a))
    z = property(lambda s: s.v[2], lambda s, a: s.__setitem__(2, a))
    def __add__(s, o): return Vector([a + b for a, b in zip(s.v, o)])
    __radd__ = __add__
    def __sub__(s, o): return Vector([a - b for a, b in zip(s.v, o)])
    def __rsub__(s, o): return Vector([b - a for a, b in zip(s.v, o)])
    def __neg__(s): return Vector([-a for a in s.v])
    def __mul__(s, k):
        if isinstance(k, Vector): raise TypeError('Vector * Vector')
        return Vector([a * k for a in s.v])
    __rmul__ = __mul__
    def __truediv__(s, k): return Vector([a / k for a in s.v])
    def __iadd__(s, o): s.v = [a + b for a, b in zip(s.v, o)]; return s
    def dot(s, o): return sum(a * b for a, b in zip(s.v, o))
    def cross(s, o): a, b = s.v, list(o); return Vector((a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]))
    @property
    def length(s): return math.sqrt(s.dot(s))
    def normalized(s): l = s.length; return Vector([a / l for a in s.v]) if l > 0 else Vector(s.v)
    def normalize(s): l = s.length; s.v = [a / l for a in s.v] if l > 0 else s.v
    def lerp(s, o, t): return Vector([a + (b - a) * t for a, b in zip(s.v, o)])
    def orthogonal(s): return s.cross(Vector((1, 0, 0)) if abs(s.v[0]) < 0.9 else Vector((0, 1, 0))).normalized()
    def to_track_quat(s, track='Z', up='Y'):
        z = s.normalized(); upv = Vector((0, 1, 0)) if up == 'Y' else Vector((0, 0, 1))
        if abs(z.dot(upv)) > 0.999: upv = Vector((1, 0, 0))
        x = upv.cross(z).normalized(); y = z.cross(x)
        if track == '-Z': z = -z; x = -x
        return _Rot(Matrix(((x[0], y[0], z[0], 0), (x[1], y[1], z[1], 0), (x[2], y[2], z[2], 0), (0, 0, 0, 1))))
    def __repr__(s): return 'Vector(%s)' % s.v

class _Rot:
    def __init__(s, M): s.M = M
    def to_matrix(s): return s.M
    def to_euler(s): return (0, 0, 0)

class Matrix:
    def __init__(s, rows=None):
        rows = rows or [[1 if i == j else 0 for j in range(4)] for i in range(4)]
        s.m = [list(map(float, r)) for r in rows]
        if len(s.m) == 3: s.m = [r + [0.0] for r in s.m] + [[0, 0, 0, 1]]
    @staticmethod
    def Identity(n): return Matrix()
    @staticmethod
    def Translation(v): M = Matrix(); M.m[0][3], M.m[1][3], M.m[2][3] = v[0], v[1], v[2]; return M
    @staticmethod
    def Diagonal(d): M = Matrix(); [M.m[i].__setitem__(i, float(d[i])) for i in range(len(d))]; return M
    @staticmethod
    def Rotation(a, n, axis):
        c, s_ = math.cos(a), math.sin(a)
        if isinstance(axis, str):
            if axis == 'X': r = ((1, 0, 0), (0, c, -s_), (0, s_, c))
            elif axis == 'Y': r = ((c, 0, s_), (0, 1, 0), (-s_, 0, c))
            else: r = ((c, -s_, 0), (s_, c, 0), (0, 0, 1))
        else:
            x, y, z = Vector(axis).normalized(); C = 1 - c
            r = ((c + x * x * C, x * y * C - z * s_, x * z * C + y * s_), (y * x * C + z * s_, c + y * y * C, y * z * C - x * s_), (z * x * C - y * s_, z * y * C + x * s_, c + z * z * C))
        return Matrix([list(row) + [0] for row in r] + [[0, 0, 0, 1]])
    def to_4x4(s): return s
    def inverted(s):
        # Gauss-Jordan 4x4 inverse (added by T2)
        a = [row[:] + [1.0 if i == j else 0.0 for j in range(4)] for i, row in enumerate(s.m)]
        for c in range(4):
            p = max(range(c, 4), key=lambda r: abs(a[r][c])); a[c], a[p] = a[p], a[c]
            pv = a[c][c]; a[c] = [x / pv for x in a[c]]
            for r in range(4):
                if r != c:
                    f = a[r][c]; a[r] = [x - f * y for x, y in zip(a[r], a[c])]
        return Matrix([row[4:] for row in a])
    def to_matrix(s): return s
    def __matmul__(s, o):
        if isinstance(o, Matrix): return Matrix([[sum(s.m[i][k] * o.m[k][j] for k in range(4)) for j in range(4)] for i in range(4)])
        v = list(o); w = v + [1.0] if len(v) == 3 else v
        r = [sum(s.m[i][k] * w[k] for k in range(4)) for i in range(4)]
        if len(v) == 3:
            return Vector(r[:3]) if isinstance(o, Vector) and getattr(o, '_dir', False) is False else Vector(r[:3])
        return Vector(r)
    def mat3_mul(s, v): return Vector([sum(s.m[i][k] * v[k] for k in range(3)) for i in range(3)])
    def __getitem__(s, i): return s.m[i]
