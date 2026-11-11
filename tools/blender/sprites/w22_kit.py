# w22_kit: shared World 22 helpers (every clock stopped at 22:22, the number 22 as real geometry). Used by the cast
# (w22_enemies.py, through jp_charkit.make_part) and by the theme modules (through a jp_kit.Builder). Not a theme or a
# cast itself (no LAYERS, no POSES), so build_country.sh skips it.
import math
import bpy, bmesh
from mathutils import Vector, Matrix

TAU = math.tau
# 22:22 on a 12-hour dial: the hour hand just past ten, the minute hand on 22 (angles clockwise from twelve)
HOUR_A = (10 + 22 / 60) / 12 * TAU
MIN_A = 22 / 60 * TAU


def dial_dir(a):
    """Unit (x, z) direction on a dial facing the camera (-Y) for a clockwise angle a from twelve."""
    return math.sin(a), math.cos(a)


def text_bm(body='22', size=1.0, extrude=0.02, bold=True):
    """The text as a bmesh lying in the XZ plane (reading left to right for the camera at -Y), centred on the origin,
    extruded along -Y (toward the camera) by 2 * extrude."""
    cu = bpy.data.curves.new('__w22txt', 'FONT')
    cu.body = body
    cu.size = size
    cu.extrude = extrude
    cu.align_x = 'CENTER'
    cu.align_y = 'CENTER'
    if bold and cu.body_format:
        for ch in cu.body_format:
            ch.use_bold = True
    ob = bpy.data.objects.new('__w22txt', cu)
    bpy.context.scene.collection.objects.link(ob)
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(ob.evaluated_get(dg))
    bm = bmesh.new()
    bm.from_mesh(me)
    bpy.data.objects.remove(ob, do_unlink=True)
    bpy.data.curves.remove(cu)
    bpy.data.meshes.remove(me)
    bm.transform(Matrix.Rotation(math.radians(90), 4, 'X'))
    return bm


# ----------------------------------------------------------------------------------------------- background pieces
# (for the theme modules: B is a jp_kit.Builder; roles come from the theme's PALETTE)
def bg_text(B, role, body, x, y, z, size, extrude=0.02):
    bm = text_bm(body, size=size, extrude=extrude)
    return B._add(bm, role, False, Matrix.Translation((x, y, z)))


def bg_clock(B, x, y, z, r, face='clock_face', rim='clock_rim', hand='clock_hand', tick=None, depth=0.12):
    """A camera-facing clock (a disc facing -Y) stopped at 22:22, rim and tick marks."""
    rot = (math.pi / 2, 0, 0)
    B.lathe(rim, [(r, 0.0), (r, depth)], 28, at=(x, y + depth, z), rot=rot, cap_top=True, cap_bottom=True)
    B.lathe(face, [(r * 0.86, 0.0), (r * 0.86, 0.04)], 28, at=(x, y - 0.0, z), rot=rot, cap_top=True, cap_bottom=True)
    tick = tick or hand
    for k in range(12):
        a = TAU * k / 12
        dx, dz = dial_dir(a)
        s = r * (0.09 if k % 3 == 0 else 0.05)
        B.box(tick, (x + dx * r * 0.7, y - 0.06, z + dz * r * 0.7), (s, 0.02, s), bevel=0.0)
    for a, ln, w in ((HOUR_A, 0.42, 0.07), (MIN_A, 0.64, 0.045)):
        dx, dz = dial_dir(a)
        B.rod(hand, (x, y - 0.07, z), (x + dx * r * ln, y - 0.07, z + dz * r * ln), r * w, segs=5)
    B.sphere(hand, (x, y - 0.08, z), r * 0.07, subdiv=1)


def bg_door(B, x, y, z, w, h, body, frame='door_frame', plaque='door_plaque', num='door_num', knob='door_knob', depth=0.2,
            number=True):
    """A door numbered 22 standing on z (bottom centre x): a round-topped slab in a frame, a cream plaque with the
    number, a brass knob."""
    B.arch(frame, (x, y + 0.04, z - 0.04), w + 0.18, h + 0.12, depth)
    B.arch(body, (x, y - 0.02, z), w, h, depth)
    if number:
        B.box(plaque, (x, y - depth * 0.5 - 0.03, z + h * 0.57), (w * 0.62, 0.03, h * 0.22), bevel=0.02)
        bg_text(B, num, '22', x, y - depth * 0.5 - 0.06, z + h * 0.57, h * 0.17, extrude=0.01)
    B.sphere(knob, (x + w * 0.3, y - depth * 0.5 - 0.04, z + h * 0.4), max(0.045, w * 0.06), subdiv=1)


def marble_veins(rng, role, n_per_tile=2, cap_h=0.3):
    """Thin marble veins inside every floor tile (no outline), added to the 'ground' collection."""
    import jp_kit as K
    B = K.Builder('ground_veins', K.GROUND_COLL)
    for col in range(8):
        for row in range(3):
            x0, x1 = col * K.T + 0.12, (col + 1) * K.T - 0.12
            z0, z1 = -row * K.T - (cap_h + 0.2 if row == 0 else 0.12), -(row + 1) * K.T + 0.12
            for k in range(n_per_tile if rng.random() < 0.7 else 0):
                ax, az = rng.uniform(x0, x1), rng.uniform(z1, z0)
                bx = min(x1, max(x0, ax + rng.uniform(-0.5, 0.5)))
                bz = min(z0, max(z1, az + rng.uniform(-0.3, 0.3)))
                mx = (ax + bx) / 2 + rng.uniform(-0.08, 0.08)
                mz = (az + bz) / 2 + rng.uniform(-0.08, 0.08)
                B.rod(role, (ax, -0.32, az), (mx, -0.32, mz), 0.012, segs=3)
                B.rod(role, (mx, -0.32, mz), (bx, -0.32, bz), 0.009, segs=3)
    ob = B.done(period=None)
    ob['outline'] = 0
    return ob
