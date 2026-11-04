# mxPepper: a cheeky hopping green chili pepper enemy for the pre-rendered 2D sprite pipeline (original cartoon design).
# Blender native axes: Z up, the pepper faces +X (its direction of travel, screen-right); the sprite camera looks
# along +Y from -Y (Blender front view). Feet on z = 0, 0.85 m tall including the stem, about 0.45 m wide.
#
# Parts (each its own object, parented to the Empty 'pepper', custom prop obj['sprite_part']):
#   body, highlight, stem (calyx cap), stalk, eye_l / eye_r, pupil_l / pupil_r, lid_l / lid_r, lash_l / lash_r
#   (closed-eye crease, only when the eyes are shut), mouth, foot_l / foot_r.
# Materials are plain Principled BSDFs with a Base Color only, so a restyling kit can swap them later:
#   pepper_body, pepper_highlight, pepper_stem, pepper_eye_white, pepper_pupil, pepper_mouth, pepper_feet.
#
# API:  build_pepper(pose='idle', t=0.0) -> root Empty      clear() -> removes the hierarchy
# Poses: idle (breathing bob at phase t in 0..1), hop, land, notice, stun, flat, ko.
# Headless preview of every pose:
#   /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/sprites/mx_pepper.py
import math
import os

import bpy
import bmesh
from mathutils import Matrix, Vector

TAU = math.tau
ROOT = 'pepper'
POSES = ('idle', 'hop', 'land', 'notice', 'stun', 'flat', 'ko')
SCRATCH = '/private/tmp/claude-501/-Users-bradymott-brady-o/f5bf6cf3-6fc7-437d-a9b3-6005c5b7ac2b/scratchpad/pepper'

COLORS = {
    'pepper_body': '#2a8a2a',
    'pepper_highlight': '#62bc48',
    'pepper_stem': '#5a7a2a',
    'pepper_eye_white': '#f8f8f0',
    'pepper_pupil': '#1a1a1a',
    'pepper_mouth': '#3a1220',
    'pepper_feet': '#1b5a1b',
}

# The body is a lathe along a curved spine, from the pointed tip (v = 0, bottom-front) to the top (v = 1):
# (centre x, centre z, ring radius, y-scale of the ring).  Fatter at the top, hooking forward at the bottom.
BODY_CTRL = [
    (0.265, 0.135, 0.000, 1.00),  # the tip hooks forward, clear of the feet
    (0.215, 0.125, 0.035, 1.00),
    (0.150, 0.135, 0.072, 1.00),
    (0.075, 0.185, 0.122, 1.00),
    (0.020, 0.290, 0.172, 1.03),
    (0.000, 0.420, 0.205, 1.07),   # chubby cheeks
    (0.000, 0.560, 0.215, 1.00),
    (0.000, 0.680, 0.185, 1.00),
    (0.000, 0.730, 0.110, 1.00),
    (0.000, 0.740, 0.000, 1.00),
]
EYE_V, EYE_A = 0.645, (-0.28, -1.24)         # height param and azimuths (rad, 0 = +X front, -pi/2 = camera side)
EYE_R = 0.074
MOUTH_V = 0.50

# Per-pose parameters: squash/stretch (about the ground), lean (deg, + = top toward +X), eye and pupil scale,
# lid coverage (0 open .. 1 shut), mouth style, foot stance.
POSE = {
    'idle':   dict(sx=1.00, sz=1.00, lean=2,  eye=1.00, pupil=1.00, lid=0.20, mouth='grin',   feet='stand'),
    'hop':    dict(sx=0.88, sz=1.16, lean=12, eye=1.00, pupil=1.00, lid=0.12, mouth='grin',   feet='tuck'),
    'land':   dict(sx=1.22, sz=0.78, lean=1,  eye=1.00, pupil=1.00, lid=0.22, mouth='grin',   feet='spread'),
    'notice': dict(sx=0.97, sz=1.06, lean=-2, eye=1.38, pupil=0.72, lid=0.00, mouth='small',  feet='stand'),
    'stun':   dict(sx=1.03, sz=0.95, lean=-5, eye=1.00, pupil=0.90, lid=0.55, mouth='wobble', feet='stand', dazed=True),
    'flat':   dict(sx=1.25, sz=0.35, lean=0,  eye=1.00, pupil=1.00, lid=1.00, mouth='flat',   feet='flat'),
    'ko':     dict(sx=1.00, sz=0.95, lean=-8, eye=1.00, pupil=1.00, lid=1.00, mouth='o',      feet='limp'),
}


# ---------------------------------------------------------------- colours / materials
def hex_linear(h):
    h = h.lstrip('#')
    c = [int(h[i:i + 2], 16) / 255.0 for i in (0, 2, 4)]
    lin = [(x / 12.92) if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c]
    return (lin[0], lin[1], lin[2], 1.0)


def material(name):
    m = bpy.data.materials.get(name)
    if m is None:
        m = bpy.data.materials.new(name)
        m.use_nodes = True
    bsdf = next((n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
    col = hex_linear(COLORS[name])
    if bsdf:      # None once a look kit has restyled the material: keep its node tree
        bsdf.inputs['Base Color'].default_value = col
        bsdf.inputs['Roughness'].default_value = 0.5
    m.diffuse_color = col
    return m


# ---------------------------------------------------------------- maths helpers
def catmull(pts, t):
    """Catmull-Rom through equal-length tuples; t in 0..1 (ends clamped)."""
    n = len(pts)
    f = min(1.0, max(0.0, t)) * (n - 1)
    k = min(n - 2, int(math.floor(f)))
    u = f - k
    p0, p1, p2, p3 = pts[max(0, k - 1)], pts[k], pts[k + 1], pts[min(n - 1, k + 2)]
    return [0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u ** 3)
            for a, b, c, d in zip(p0, p1, p2, p3)]


def perp_frame(az):
    """Two unit vectors ax, ay with ax x ay = az (az unit)."""
    ref = Vector((0, 0, 1)) if abs(az.z) < 0.9 else Vector((1, 0, 0))
    ax = ref.cross(az).normalized()
    ay = az.cross(ax)
    return ax, ay


def rot_y(deg):
    return Matrix.Rotation(math.radians(deg), 4, 'Y')


# ---------------------------------------------------------------- body surface
def body_frame(v):
    """Spine centre, ring normal (in XZ), ring radius and y-scale at height parameter v (0 tip .. 1 top)."""
    cx, cz, r, ky = catmull(BODY_CTRL, v)
    e = 1e-3
    ax, az = catmull(BODY_CTRL, v + e)[:2]
    bx, bz = catmull(BODY_CTRL, v - e)[:2]
    tx, tz = ax - bx, az - bz
    l = math.hypot(tx, tz) or 1.0
    tx, tz = tx / l, tz / l
    n = Vector((tz, 0.0, -tx))            # ring axis pointing to the front (+X) when the spine is vertical
    return Vector((cx, 0.0, cz)), n, max(0.0, r), ky


def body_point(v, a):
    c, n, r, ky = body_frame(v)
    return c + r * (math.cos(a) * n + math.sin(a) * ky * Vector((0, 1, 0)))


def body_normal(v, a):
    e = 1e-3
    dv = body_point(v + e, a) - body_point(v - e, a)
    da = body_point(v, a + e) - body_point(v, a - e)
    nrm = da.cross(dv)
    if nrm.length < 1e-9:
        nrm = body_point(v, a) - body_frame(v)[0]
    nrm.normalize()
    if nrm.dot(body_point(v, a) - body_frame(v)[0]) < 0:
        nrm = -nrm
    return nrm


# ---------------------------------------------------------------- bmesh builders
def ring_mesh(rings):
    """Rings ordered top -> bottom; each a list of Vectors (same count, counter-clockwise seen from the top)
    or a single Vector (a pole).  Returns a bmesh of quads with triangle fans at the poles."""
    bm = bmesh.new()
    vs = []
    for ring in rings:
        if isinstance(ring, Vector):
            vs.append(bm.verts.new(ring))
        else:
            vs.append([bm.verts.new(p) for p in ring])
    for A, B in zip(vs, vs[1:]):
        if isinstance(A, list) and isinstance(B, list):
            n = len(A)
            for j in range(n):
                bm.faces.new((A[j], B[j], B[(j + 1) % n], A[(j + 1) % n]))
        elif isinstance(A, list):
            n = len(A)
            for j in range(n):
                bm.faces.new((A[j], B, A[(j + 1) % n]))
        elif isinstance(B, list):
            n = len(B)
            for j in range(n):
                bm.faces.new((A, B[j], B[(j + 1) % n]))
    bm.normal_update()
    return bm


def ellipsoid(c, ax, ay, az, seg=16, rows=10, phi0=0.0, phi1=math.pi):
    """Parametric ellipsoid: c + sin(phi)(cos(th) ax + sin(th) ay) + cos(phi) az, with ax x ay along az."""
    rings = []
    for i in range(rows + 1):
        phi = phi0 + (phi1 - phi0) * i / rows
        if phi < 1e-6:
            rings.append(c + az)
        elif phi > math.pi - 1e-6:
            rings.append(c - az)
        else:
            rings.append([c + math.sin(phi) * (math.cos(th) * ax + math.sin(th) * ay) + math.cos(phi) * az
                          for th in (TAU * j / seg for j in range(seg))])
    return ring_mesh(rings)


def tube(path, r0, r1=None, seg=8):
    """Round tube along a polyline of Vectors, radius r0 -> r1, with pole-closed ends."""
    r1 = r0 if r1 is None else r1
    n = len(path)
    rings = []
    for i, p in enumerate(path):
        t = (path[min(i + 1, n - 1)] - path[max(i - 1, 0)]).normalized()
        r = r0 + (r1 - r0) * i / (n - 1)
        az = -t
        ax, ay = perp_frame(az)
        if i == 0:
            rings.append(p + az * r * 0.5)
        rings.append([p + r * (math.cos(th) * ax + math.sin(th) * ay) for th in (TAU * j / seg for j in range(seg))])
        if i == n - 1:
            rings.append(p - az * r * 0.5)
    return ring_mesh(rings)


def solid_patch(outer, inner):
    """A closed slab between two rows x cols grids of Vectors (outer and inner skins)."""
    bm = bmesh.new()
    R, C = len(outer), len(outer[0])
    O = [[bm.verts.new(p) for p in row] for row in outer]
    I = [[bm.verts.new(p) for p in row] for row in inner]
    for r in range(R - 1):
        for c in range(C - 1):
            bm.faces.new((O[r][c], O[r][c + 1], O[r + 1][c + 1], O[r + 1][c]))
            bm.faces.new((I[r + 1][c], I[r + 1][c + 1], I[r][c + 1], I[r][c]))
    for c in range(C - 1):
        bm.faces.new((O[0][c + 1], O[0][c], I[0][c], I[0][c + 1]))
        bm.faces.new((O[R - 1][c], O[R - 1][c + 1], I[R - 1][c + 1], I[R - 1][c]))
    for r in range(R - 1):
        bm.faces.new((O[r][0], O[r + 1][0], I[r + 1][0], I[r][0]))
        bm.faces.new((O[r + 1][C - 1], O[r][C - 1], I[r][C - 1], I[r + 1][C - 1]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


# ---------------------------------------------------------------- scene objects
def clear():
    """Remove the 'pepper' hierarchy (and its mesh data)."""
    root = bpy.data.objects.get(ROOT)
    if root is None:
        return
    for ob in list(root.children_recursive) + [root]:
        me = ob.data if ob.type == 'MESH' else None
        bpy.data.objects.remove(ob, do_unlink=True)
        if me is not None and me.users == 0:
            bpy.data.meshes.remove(me)


def _link(ob):
    bpy.context.scene.collection.objects.link(ob)


def make_part(name, bm, mat_name, root, M, subsurf=2, smooth=True):
    bm.transform(M)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(material(mat_name))
    if smooth:
        me.polygons.foreach_set('use_smooth', [True] * len(me.polygons))
    me.update()
    ob = bpy.data.objects.new(name, me)
    _link(ob)
    ob.parent = root
    ob['sprite_part'] = name
    if subsurf:
        mod = ob.modifiers.new('subsurf', 'SUBSURF')
        mod.levels = mod.render_levels = subsurf
    return ob


# ---------------------------------------------------------------- part generators (rest space)
def body_bm(rings=30, seg=28):
    out = []
    for i in range(rings + 1):
        v = 1.0 - i / rings
        c, n, r, ky = body_frame(v)
        if i == 0:
            out.append(Vector((0.0, 0.0, BODY_CTRL[-1][1])))
        elif i == rings:
            out.append(Vector((BODY_CTRL[0][0], 0.0, BODY_CTRL[0][1])))
        else:
            out.append([c + r * (math.cos(a) * n + math.sin(a) * ky * Vector((0, 1, 0)))
                        for a in (TAU * j / seg for j in range(seg))])
    return ring_mesh(out)


def stem_cap_bm(seg=30, rows=8):
    """A five-lobed calyx cap sitting on the top of the pepper, lobes drooping over the shoulders."""
    c = Vector((0.0, 0.0, 0.705))
    R, H = 0.135, 0.075
    rings = [c + Vector((0, 0, H))]
    for i in range(1, rows + 1):
        phi = math.radians(112) * i / rows
        ring = []
        for j in range(seg):
            th = TAU * j / seg
            lobe = 0.5 * (1 - math.cos(5 * th + 0.4))
            rr = R * math.sin(phi) * (1 + 0.22 * lobe)
            z = H * math.cos(phi) - 0.035 * lobe * math.sin(phi) ** 2
            ring.append(c + Vector((rr * math.cos(th), rr * math.sin(th), z)))
        rings.append(ring)
    rings.append(c + Vector((0, 0, -0.05)))
    return ring_mesh(rings)


def stalk_bm():
    path = [Vector((0.0, 0.0, 0.755)), Vector((-0.01, 0.0, 0.80)), Vector((-0.032, 0.0, 0.835))]
    return tube(path, 0.031, 0.025, seg=10)


def highlight_bm():
    v, a = 0.77, math.radians(-135)
    p, n = body_point(v, a), body_normal(v, a)
    up = (Vector((0, 0, 1)) - n * n.z).normalized()
    s = up.cross(n)
    return ellipsoid(p - n * 0.022, s * 0.040, up * 0.068, n * 0.028, seg=14, rows=8)


def eye_parts(side, a, P, root, M):
    """One eye: white ellipsoid, pupil, lid (and a crease when shut).  side is 'l' or 'r'."""
    er = EYE_R * P['eye']
    p, n = body_point(EYE_V, a), body_normal(EYE_V, a)
    up = (Vector((0, 0, 1)) - n * n.z).normalized()
    s = up.cross(n)
    c = p - n * 0.015
    make_part('eye_' + side, ellipsoid(c, n * er * 0.92, s * er * 0.92, up * er * 1.08, seg=18, rows=12),
              'pepper_eye_white', root, M)
    shut = P['lid'] >= 0.999
    if not shut:
        if P.get('dazed'):
            look = Vector((0.25, -0.8, 0.55)) if side == 'l' else Vector((0.6, -0.8, -0.45))
        else:
            look = Vector((0.55, -0.85, -0.10))
        d = (n * 0.9 + look).normalized()
        pr = 0.038 * P['pupil'] * math.sqrt(P['eye'])
        px, py = perp_frame(d)
        make_part('pupil_' + side, ellipsoid(c + d * er * 0.82, px * pr, py * pr, d * pr * 0.65, seg=14, rows=8),
                  'pepper_pupil', root, M)
    if P['lid'] > 0.001:
        lup = (Vector((0, 0, 1)) + n * 0.3).normalized()
        lax = (n - lup * lup.dot(n)).normalized()
        lay = lup.cross(lax)
        lr = er * 1.06
        phi1 = math.pi if shut else P['lid'] * math.pi
        make_part('lid_' + side, ellipsoid(c, lax * lr * 0.95, lay * lr * 0.95, lup * lr * 1.1, seg=18, rows=10, phi1=phi1),
                  'pepper_body', root, M)
        if shut:
            path = []
            for k in range(11):
                sdeg = -1 + 2 * k / 10
                phi = math.radians(90 - 26 * math.cos(sdeg * math.pi / 2))
                th = sdeg * math.radians(52)
                rr = lr * 1.0 + 0.010
                path.append(c + rr * (math.sin(phi) * (math.cos(th) * lax + math.sin(th) * lay) + math.cos(phi) * lup * 1.1))
            make_part('lash_' + side, tube(path, 0.009, seg=8), 'pepper_pupil', root, M)


def mouth_bm(style):
    a0, a1 = math.radians(14), math.radians(-100)
    if style == 'small':
        a0, a1 = math.radians(-10), math.radians(-72)
    if style in ('grin', 'small'):
        depth = 0.075 if style == 'grin' else 0.040
        curl = 0.050 if style == 'grin' else 0.025
        cols, rows = 14, 3
        outer, inner = [], []
        for r in range(rows):
            w = r / (rows - 1)
            ro, ri = [], []
            for cidx in range(cols):
                u = cidx / (cols - 1)
                a = a0 + (a1 - a0) * u
                v_top = MOUTH_V + curl * 4 * (u - 0.5) ** 2
                v_bot = v_top - depth * math.sin(math.pi * u) ** 0.85
                v = v_top + (v_bot - v_top) * w
                p, n = body_point(v, a), body_normal(v, a)
                ro.append(p + n * 0.012)
                ri.append(p - n * 0.020)
            outer.append(ro)
            inner.append(ri)
        return solid_patch(outer, inner)
    if style == 'o':
        a = math.radians(-40)
        v = MOUTH_V - 0.02
        p, n = body_point(v, a), body_normal(v, a)
        up = (Vector((0, 0, 1)) - n * n.z).normalized()
        s = up.cross(n)
        return ellipsoid(p - n * 0.015, s * 0.040, up * 0.050, n * 0.030, seg=14, rows=8)
    # line mouths: 'flat' (straight) and 'wobble' (wavy)
    path = []
    for k in range(13):
        u = k / 12
        a = a0 + (a1 - a0) * u
        v = MOUTH_V - 0.01
        if style == 'wobble':
            v += 0.022 * math.sin(3 * math.pi * u)
        p, n = body_point(v, a), body_normal(v, a)
        path.append(p + n * 0.008)
    return tube(path, 0.016, seg=8)


def foot_bm(side, stance, t):
    near = side == 'l'            # 'l' is the camera-side foot (-Y); 'r' the far one
    y = -0.075 if near else 0.075
    x = 0.095 if near else -0.015
    z = 0.045
    rx, ry, rz = 0.080, 0.056, 0.045
    tilt = 0.0
    shuffle = 0.006 * max(0.0, math.sin(TAU * t + (0 if near else math.pi)))
    if stance == 'tuck':
        x, z, tilt = (0.05 if near else 0.0), 0.12, 35.0
        rx, rz = 0.065, 0.040
    elif stance == 'spread':
        x, z, rz = (0.15 if near else -0.09), 0.035, 0.035
        rx = 0.09
    elif stance == 'flat':
        x, z, rz = (0.22 if near else -0.17), 0.03, 0.03
        rx, y = 0.095, (-0.05 if near else 0.05)
    elif stance == 'limp':
        x, tilt = (0.13 if near else -0.07), -30.0
        z = 0.05
    c = Vector((x, y, z + shuffle))
    R = rot_y(tilt).to_3x3()
    bm = ellipsoid(Vector((0, 0, 0)), Vector((rx, 0, 0)), Vector((0, ry, 0)), Vector((0, 0, rz)), seg=14, rows=8)
    bm.transform(Matrix.Translation(c) @ R.to_4x4())
    return bm


# ---------------------------------------------------------------- public API
def build_pepper(pose='idle', t=0.0):
    """Build the pepper in the given pose (fresh geometry every call) and return the root Empty."""
    if pose not in POSE:
        raise ValueError('unknown pose %r; one of %s' % (pose, POSES))
    clear()
    P = dict(POSE[pose])
    sx, sz = P['sx'], P['sz']
    if pose == 'idle':
        b = math.sin(TAU * t)
        sz *= 1 + 0.035 * b
        sx *= 1 - 0.020 * b
    M = rot_y(P['lean']) @ Matrix.Diagonal((sx, sx, sz, 1.0))

    root = bpy.data.objects.new(ROOT, None)
    root.empty_display_type = 'PLAIN_AXES'
    root.empty_display_size = 0.2
    _link(root)
    root['sprite_part'] = ROOT
    root['pose'] = pose

    make_part('body', body_bm(), 'pepper_body', root, M)
    make_part('highlight', highlight_bm(), 'pepper_highlight', root, M)
    make_part('stem', stem_cap_bm(), 'pepper_stem', root, M)
    make_part('stalk', stalk_bm(), 'pepper_stem', root, M)
    eye_parts('r', EYE_A[0], P, root, M)       # the front eye (toward +X)
    eye_parts('l', EYE_A[1], P, root, M)       # the camera-side eye
    make_part('mouth', mouth_bm(P['mouth']), 'pepper_mouth', root, M)
    make_part('foot_l', foot_bm('l', P['feet'], t), 'pepper_feet', root, M)
    make_part('foot_r', foot_bm('r', P['feet'], t), 'pepper_feet', root, M)
    return root


def triangle_count(root, evaluated=False):
    total = 0
    dg = bpy.context.evaluated_depsgraph_get() if evaluated else None
    for ob in root.children_recursive:
        if ob.type != 'MESH':
            continue
        me = ob.evaluated_get(dg).data if evaluated else ob.data
        total += sum(len(p.vertices) - 2 for p in me.polygons)
    return total


# ---------------------------------------------------------------- preview rendering
def setup_preview_scene():
    scene = bpy.context.scene
    for ob in list(bpy.data.objects):
        if ob.name != ROOT and ob.parent is None and bpy.data.objects.get(ROOT) not in ob.children_recursive:
            if ob.get('sprite_part') is None:
                bpy.data.objects.remove(ob, do_unlink=True)
    try:
        scene.render.engine = 'BLENDER_EEVEE'
    except TypeError as e:
        print('engine fallback:', e)
        scene.render.engine = 'BLENDER_WORKBENCH'
    scene.render.resolution_x = scene.render.resolution_y = 512
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.view_settings.view_transform = 'Standard'
    if hasattr(scene, 'eevee'):
        scene.eevee.taa_render_samples = 32

    cam_data = bpy.data.cameras.new('sprite_cam')
    cam_data.type = 'ORTHO'
    cam_data.ortho_scale = 1.4
    cam = bpy.data.objects.new('sprite_cam', cam_data)
    cam.location = (0.0, -4.0, 0.45)
    cam.rotation_euler = (math.pi / 2, 0.0, 0.0)      # looking along +Y
    _link(cam)
    scene.camera = cam

    sun_data = bpy.data.lights.new('sprite_sun', 'SUN')
    sun_data.energy = 3.0
    sun_data.angle = math.radians(12)
    sun = bpy.data.objects.new('sprite_sun', sun_data)
    sun.rotation_euler = (math.radians(55), 0.0, math.radians(35))   # from the upper front, camera side
    _link(sun)

    world = scene.world or bpy.data.worlds.new('World')
    scene.world = world
    world.use_nodes = True
    bg = next((n for n in world.node_tree.nodes if n.type == 'BACKGROUND'), None)
    if bg is not None:
        bg.inputs[0].default_value = (0.55, 0.62, 0.72, 1.0)
        bg.inputs[1].default_value = 0.55
    return scene


def render_pose(pose, t=0.0, suffix=''):
    root = build_pepper(pose, t)
    path = os.path.join(SCRATCH, 'pepper_%s%s.png' % (pose, suffix))
    bpy.context.scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    return root, path


def thumbnail(path, size=48):
    img = bpy.data.images.load(path)
    img.scale(size, size)
    out = path.replace('.png', '_%d.png' % size)
    img.filepath_raw = out
    img.file_format = 'PNG'
    img.save()
    bpy.data.images.remove(img)
    return out


def contact_sheet(paths, out, cell=256):
    import numpy as np
    n = len(paths)
    sheet = np.zeros((cell, cell * n, 4), dtype=np.float32)
    for i, p in enumerate(paths):
        img = bpy.data.images.load(p)
        img.scale(cell, cell)
        px = np.array(img.pixels[:], dtype=np.float32).reshape(cell, cell, 4)
        sheet[:, i * cell:(i + 1) * cell, :] = px
        bpy.data.images.remove(img)
    # a mid-grey backdrop so the transparent film reads
    alpha = sheet[..., 3:4]
    sheet[..., :3] = sheet[..., :3] + (1 - alpha) * 0.35
    sheet[..., 3] = 1.0
    res = bpy.data.images.new('sheet', cell * n, cell, alpha=True)
    res.pixels[:] = sheet.ravel().tolist()
    res.filepath_raw = out
    res.file_format = 'PNG'
    res.save()
    bpy.data.images.remove(res)
    return out


if __name__ == '__main__':
    os.makedirs(SCRATCH, exist_ok=True)
    setup_preview_scene()
    outs = []
    for pose in POSES:
        root, path = render_pose(pose)
        tris = triangle_count(root)
        tris_eval = triangle_count(root, evaluated=True)
        zs = [(root.matrix_world @ ob.matrix_world @ Vector(co)).z for ob in root.children_recursive if ob.type == 'MESH' for co in ob.bound_box]
        xs = [(ob.matrix_world @ Vector(co)).x for ob in root.children_recursive if ob.type == 'MESH' for co in ob.bound_box]
        print('%-7s %s  base tris %d  subdivided %d  height %.3f  width %.3f' % (pose, path, tris, tris_eval, max(zs), max(xs) - min(xs)))
        outs.append(path)
    _, p = render_pose('idle', 0.5, '_t50')
    outs.append(p)
    print('idle t=0.5', p)
    small = [thumbnail(p, 48) for p in outs]
    print('thumbnails', *small)
    print('sheet', contact_sheet(outs, os.path.join(SCRATCH, 'pepper_sheet.png')))
    print('sheet48', contact_sheet(small, os.path.join(SCRATCH, 'pepper_sheet_48.png'), cell=48))
