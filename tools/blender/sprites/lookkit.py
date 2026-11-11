# Look kit for Super Brady-O World's pre-rendered 2D sprites: restyles any scene's plain Principled materials into one
# of the candidate looks, sets up the orthographic side camera, the lights and the transparent EEVEE render.
#
#   toon  : flat cel shading (hard 3-band ramp), crisp dark outlines (inverted hull), clean saturated colour
#   toon2 : the characters' Fiesta Toon (Nov 2026 readability pass, docs/ART_READABILITY.md): still flat cel bands and
#           dark ink, but with form for a phone screen: a 4-band ramp (deep shadow, shadow, mid, light) under a more
#           raking key light, a crisp rim light along the upper silhouette, a hard specular glint, more saturated
#           key colours and bright unlit eye whites. The silhouette ink, the light keyline and the top-to-toe value
#           ramp are added in 2D by pack_atlas.py (HALO=1), so the outer contour is heavier than the interior lines.
#   paint : soft painterly shading (smooth ramp, brush-stroke texture, warm rim light), no hard ink, canvas grain in post
#   ink   : printed-poster look: 2-band fill, variable-width Freestyle ink lines, paper grain + a hint of misregistration in post
#
# Scale: 1 m = PPM logical screen pixels (the player is 1.85 m = 52 px, like the 2D game); TEX texels per logical pixel.
# Blender axes: Z up, the camera looks along +Y from -Y (front view), so +X is screen-right.
import bpy, math, os, sys
from mathutils import Vector

PPM = 28.1          # logical px per metre
TEX = 3             # render texels per logical px (an iPhone draws ~3 device px per logical px)
LOOKS = ('toon', 'toon2', 'paint', 'ink')

def srgb_lin(hexcol):
    h = hexcol.lstrip('#'); r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    f = lambda c: c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return (f(r), f(g), f(b))

def principled_base(mat):
    """(linear rgb, roughness) of a material's Principled BSDF, or its viewport colour."""
    if mat.use_nodes and mat.node_tree:
        n = next((n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
        if n:
            c = n.inputs['Base Color'].default_value
            return (c[0], c[1], c[2]), n.inputs['Roughness'].default_value
    c = mat.diffuse_color
    return (c[0], c[1], c[2]), 0.6

_STYLED = {}

def _ramp(nodes, stops, interp):
    r = nodes.new('ShaderNodeValToRGB'); r.color_ramp.interpolation = interp
    el = r.color_ramp.elements
    while len(el) > 1: el.remove(el[-1])
    el[0].position = stops[0][0]; el[0].color = stops[0][1]
    for pos, col in stops[1:]:
        e = el.new(pos); e.color = col
    return r

def style_material(mat, look, keep=None):
    """Rebuild `mat`'s node tree for `look`, keeping its base colour. Idempotent."""
    key = (mat.name, look)
    if _STYLED.get(mat.name) == look: return
    _STYLED[mat.name] = look
    base, rough = principled_base(mat)
    mat.use_nodes = True
    nt = mat.node_tree; nodes = nt.nodes; links = nt.links
    nodes.clear()
    out = nodes.new('ShaderNodeOutputMaterial')
    col = nodes.new('ShaderNodeRGB'); col.outputs[0].default_value = (*base, 1)
    if 'glow' in mat.name or mat.name in ('crystal_pale', 'sky_hole', 'sky_rim', 'lava_glow'):
        # glowing things: unlit, slightly lifted base colour, no shading bands
        lift = nodes.new('ShaderNodeMix'); lift.data_type = 'RGBA'; lift.blend_type = 'ADD'; lift.inputs[0].default_value = 1.0
        lift.inputs[6].default_value = (*base, 1); lift.inputs[7].default_value = (0.12, 0.08, 0.02, 1)
        em = nodes.new('ShaderNodeEmission'); em.inputs[1].default_value = 1.0
        links.new(lift.outputs[2], em.inputs[0]); links.new(em.outputs[0], out.inputs[0])
    elif look == 'toon':
        # diffuse -> shader to rgb -> hard ramp (shadow / mid / light) * base colour -> emission (unlit, flat)
        d = nodes.new('ShaderNodeBsdfDiffuse'); s2r = nodes.new('ShaderNodeShaderToRGB')
        links.new(d.outputs[0], s2r.inputs[0])
        ramp = _ramp(nodes, [(0.0, (0.62, 0.56, 0.72, 1)), (0.30, (0.86, 0.84, 0.92, 1)), (0.58, (1.06, 1.04, 1.0, 1))], 'CONSTANT')
        links.new(s2r.outputs[0], ramp.inputs[0])
        mul = nodes.new('ShaderNodeMix'); mul.data_type = 'RGBA'; mul.blend_type = 'MULTIPLY'; mul.inputs[0].default_value = 1.0
        links.new(ramp.outputs[0], mul.inputs[6]); links.new(col.outputs[0], mul.inputs[7])
        em = nodes.new('ShaderNodeEmission'); em.inputs[1].default_value = 1.0
        links.new(mul.outputs[2], em.inputs[0]); links.new(em.outputs[0], out.inputs[0])
    elif look == 'toon2':
        _toon2(mat, nodes, links, out, col, base, rough)
    elif look == 'paint':
        # soft ramp with a warm light / cool shadow, a brush-stroke noise breaking up the fill, a warm rim
        d = nodes.new('ShaderNodeBsdfDiffuse'); s2r = nodes.new('ShaderNodeShaderToRGB')
        links.new(d.outputs[0], s2r.inputs[0])
        ramp = _ramp(nodes, [(0.0, (0.50, 0.46, 0.62, 1)), (0.30, (0.78, 0.74, 0.84, 1)), (0.55, (1.0, 0.98, 0.94, 1)), (0.9, (1.08, 1.04, 0.96, 1))], 'EASE')
        links.new(s2r.outputs[0], ramp.inputs[0])
        # brush strokes: stretched noise in object space, remapped to a gentle +-8% value wobble
        tc = nodes.new('ShaderNodeTexCoord'); mp = nodes.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (14, 3, 14)
        links.new(tc.outputs['Object'], mp.inputs[0])
        nz = nodes.new('ShaderNodeTexNoise'); nz.inputs['Detail'].default_value = 3.0; nz.inputs['Roughness'].default_value = 0.6
        links.new(mp.outputs[0], nz.inputs[0])
        mr = nodes.new('ShaderNodeMapRange'); mr.inputs['From Min'].default_value = 0.35; mr.inputs['From Max'].default_value = 0.65
        mr.inputs['To Min'].default_value = 0.90; mr.inputs['To Max'].default_value = 1.10
        links.new(nz.outputs['Fac'], mr.inputs[0])
        stroke = nodes.new('ShaderNodeMix'); stroke.data_type = 'RGBA'; stroke.blend_type = 'MULTIPLY'; stroke.inputs[0].default_value = 1.0
        links.new(ramp.outputs[0], stroke.inputs[6]); links.new(mr.outputs[0], stroke.inputs[7])
        mul = nodes.new('ShaderNodeMix'); mul.data_type = 'RGBA'; mul.blend_type = 'MULTIPLY'; mul.inputs[0].default_value = 1.0
        links.new(stroke.outputs[2], mul.inputs[6]); links.new(col.outputs[0], mul.inputs[7])
        # soft dark edge (a painted contour) + warm rim from the layer weight
        lw = nodes.new('ShaderNodeLayerWeight'); lw.inputs['Blend'].default_value = 0.35
        edge = _ramp(nodes, [(0.0, (1, 1, 1, 1)), (0.72, (1, 1, 1, 1)), (1.0, (0.55, 0.45, 0.6, 1))], 'EASE')
        links.new(lw.outputs['Facing'], edge.inputs[0])
        e2 = nodes.new('ShaderNodeMix'); e2.data_type = 'RGBA'; e2.blend_type = 'MULTIPLY'; e2.inputs[0].default_value = 1.0
        links.new(mul.outputs[2], e2.inputs[6]); links.new(edge.outputs[0], e2.inputs[7])
        em = nodes.new('ShaderNodeEmission'); em.inputs[1].default_value = 1.0
        links.new(e2.outputs[2], em.inputs[0]); links.new(em.outputs[0], out.inputs[0])
    elif look == 'ink':
        # two flat tones (light / shadow) with a slightly desaturated, warm-paper shadow; the lines come from Freestyle
        d = nodes.new('ShaderNodeBsdfDiffuse'); s2r = nodes.new('ShaderNodeShaderToRGB')
        links.new(d.outputs[0], s2r.inputs[0])
        ramp = _ramp(nodes, [(0.0, (0.62, 0.56, 0.60, 1)), (0.42, (1.0, 1.0, 1.0, 1))], 'CONSTANT')
        links.new(s2r.outputs[0], ramp.inputs[0])
        mul = nodes.new('ShaderNodeMix'); mul.data_type = 'RGBA'; mul.blend_type = 'MULTIPLY'; mul.inputs[0].default_value = 1.0
        links.new(ramp.outputs[0], mul.inputs[6]); links.new(col.outputs[0], mul.inputs[7])
        em = nodes.new('ShaderNodeEmission'); em.inputs[1].default_value = 1.0
        links.new(mul.outputs[2], em.inputs[0]); links.new(em.outputs[0], out.inputs[0])
    else:
        raise ValueError(look)
    mat.blend_method = 'OPAQUE' if hasattr(mat, 'blend_method') else None

import colorsys
def _lin_srgb(c): return c * 12.92 if c <= 0.0031308 else 1.055 * c ** (1 / 2.4) - 0.055
def _srgb_lin1(c): return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
def punch(base, sat=1.22, deep=0.0):
    """A key colour with more punch: saturation up (sRGB HSV), very pale tints pulled a little toward their hue."""
    r, g, b = (_lin_srgb(max(0.0, min(1.0, c))) for c in base)
    h, l, sv = colorsys.rgb_to_hls(r, g, b)
    if sv > 0.04: sv = min(1.0, sv * sat + 0.03)
    if l > 0.82 and sv > 0.1: l = 0.82 + (l - 0.82) * 0.6          # pale pastel fills: a touch deeper so the light band reads
    r, g, b = colorsys.hls_to_rgb(h, l - deep, sv)
    return tuple(_srgb_lin1(max(0.0, min(1.0, c))) for c in (r, g, b))

TOON2 = {
    # band colours multiply the base colour: deep shadow, shadow, mid, light (cool purple shade, warm light)
    'ramp': [(0.0, (0.46, 0.40, 0.64)), (0.17, (0.66, 0.60, 0.80)), (0.40, (0.92, 0.90, 0.97)), (0.70, (1.12, 1.09, 1.02))],
    'rim': 0.6, 'rim_col': (1.0, 0.97, 0.88), 'rim_facing': 0.74, 'rim_dir': (0.62, 0.0, 0.78), 'rim_up': 0.45,
    'spec': 0.55, 'spec_rough': 0.22,
}

def _toon2(mat, nodes, links, out, col, base, rough):
    name = mat.name.lower()
    eye_white = 'eye_white' in name or name.endswith('_sclera')
    if eye_white:
        # eye whites: flat, bright and unlit, so faces read at 24 px
        col.outputs[0].default_value = (0.95, 0.95, 0.93, 1)
        em = nodes.new('ShaderNodeEmission'); em.inputs[1].default_value = 1.0
        links.new(col.outputs[0], em.inputs[0]); links.new(em.outputs[0], out.inputs[0]); return
    pupil = 'pupil' in name
    col.outputs[0].default_value = (*(punch(base) if not pupil else base), 1)
    T = TOON2
    d = nodes.new('ShaderNodeBsdfDiffuse'); s2r = nodes.new('ShaderNodeShaderToRGB'); links.new(d.outputs[0], s2r.inputs[0])
    ramp = _ramp(nodes, [(p, (*c, 1)) for p, c in T['ramp']], 'CONSTANT'); links.new(s2r.outputs[0], ramp.inputs[0])
    mul = nodes.new('ShaderNodeMix'); mul.data_type = 'RGBA'; mul.blend_type = 'MULTIPLY'; mul.inputs[0].default_value = 1.0
    links.new(ramp.outputs[0], mul.inputs[6]); links.new(col.outputs[0], mul.inputs[7])
    cur = mul.outputs[2]
    # rim light: a hard band where the surface turns away from the camera on its upper side
    lw = nodes.new('ShaderNodeLayerWeight'); lw.inputs['Blend'].default_value = 0.5
    gt = nodes.new('ShaderNodeMath'); gt.operation = 'GREATER_THAN'; gt.inputs[1].default_value = T['rim_facing']
    links.new(lw.outputs['Facing'], gt.inputs[0])
    geo = nodes.new('ShaderNodeNewGeometry'); dot = nodes.new('ShaderNodeVectorMath'); dot.operation = 'DOT_PRODUCT'
    links.new(geo.outputs['Normal'], dot.inputs[0]); dot.inputs[1].default_value = T['rim_dir']
    up = nodes.new('ShaderNodeMath'); up.operation = 'GREATER_THAN'; up.inputs[1].default_value = T['rim_up']; links.new(dot.outputs['Value'], up.inputs[0])
    both = nodes.new('ShaderNodeMath'); both.operation = 'MULTIPLY'; links.new(gt.outputs[0], both.inputs[0]); links.new(up.outputs[0], both.inputs[1])
    k = nodes.new('ShaderNodeMath'); k.operation = 'MULTIPLY'; k.inputs[1].default_value = T['rim'] * (0.5 if pupil else 1.0); links.new(both.outputs[0], k.inputs[0])
    rim = nodes.new('ShaderNodeMix'); rim.data_type = 'RGBA'; rim.blend_type = 'MIX'
    links.new(k.outputs[0], rim.inputs[0]); links.new(cur, rim.inputs[6]); rim.inputs[7].default_value = (*T['rim_col'], 1)
    cur = rim.outputs[2]
    # specular glint: a hard-edged highlight from a glossy lobe
    sk = T['spec'] * (1.4 if pupil else max(0.25, 1.0 - rough))
    if sk > 0.05:
        gl = nodes.new('ShaderNodeBsdfGlossy'); gl.inputs['Roughness'].default_value = T['spec_rough']
        s2 = nodes.new('ShaderNodeShaderToRGB'); links.new(gl.outputs[0], s2.inputs[0])
        sr = _ramp(nodes, [(0.0, (0, 0, 0, 1)), (0.55, (1, 1, 1, 1))], 'CONSTANT'); links.new(s2.outputs[0], sr.inputs[0])
        bw = nodes.new('ShaderNodeRGBToBW'); links.new(sr.outputs[0], bw.inputs[0])
        sm = nodes.new('ShaderNodeMath'); sm.operation = 'MULTIPLY'; sm.inputs[1].default_value = sk; links.new(bw.outputs[0], sm.inputs[0])
        add = nodes.new('ShaderNodeMix'); add.data_type = 'RGBA'; add.blend_type = 'MIX'
        links.new(sm.outputs[0], add.inputs[0]); links.new(cur, add.inputs[6]); add.inputs[7].default_value = (1, 1, 0.97, 1)
        cur = add.outputs[2]
    em = nodes.new('ShaderNodeEmission'); em.inputs[1].default_value = 1.0
    links.new(cur, em.inputs[0]); links.new(em.outputs[0], out.inputs[0])

def enlarge_eyes(objects, k=1.15):
    """Bigger eyes: every eye white named eye_<side> (with its pupil, lid, lash and brow) grows by k about its own
    centre, so the face reads at phone size. Objects that don't follow the naming are left alone."""
    if k == 1: return
    from mathutils import Matrix
    by = {o.name.split('.')[0]: o for o in objects if o.type == 'MESH'}
    for side in ('l', 'r'):
        eye = by.get('eye_' + side)
        if not eye: continue
        dg = bpy.context.evaluated_depsgraph_get()
        ws = [eye.matrix_world @ v.co for v in eye.data.vertices]
        if not ws: continue
        c = sum(ws, Vector()) / len(ws)
        M = Matrix.Translation(c) @ Matrix.Scale(k, 4) @ Matrix.Translation(-c)
        for nm in ('eye_', 'pupil_', 'lid_', 'lash_', 'brow_', 'shine_', 'glint_', 'iris_'):
            o = by.get(nm + side)
            if o: o.matrix_world = M @ o.matrix_world

def outline_material(color='#2a1f2e'):
    m = bpy.data.materials.get('__outline')
    if m: return m
    m = bpy.data.materials.new('__outline'); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial'); em = nt.nodes.new('ShaderNodeEmission')
    em.inputs[0].default_value = (*srgb_lin(color), 1); em.inputs[1].default_value = 1.0
    nt.links.new(em.outputs[0], out.inputs[0])
    m.use_backface_culling = True
    return m

def add_outline(obj, width_m):
    """Inverted-hull outline: a flipped, backface-culled shell `width_m` thick (world units)."""
    if obj.type != 'MESH' or width_m <= 0 or float(obj.get('outline', 1.0)) <= 0: return   # obj['outline'] = 0: no ink
    om = outline_material()
    if om.name not in [m.name for m in obj.data.materials if m]:
        obj.data.materials.append(om)
    idx = [m.name if m else '' for m in obj.data.materials].index(om.name)
    mod = obj.modifiers.get('__outline') or obj.modifiers.new('__outline', 'SOLIDIFY')
    mod.thickness = -width_m * float(obj.get('outline', 1.0)); mod.offset = 1.0; mod.use_flip_normals = True
    mod.use_rim = False; mod.material_offset = idx; mod.material_offset_rim = idx
    mod.use_quality_normals = True

def apply_look(look, objects, outline_px=0.8):
    """Restyle every material of `objects` for `look` and add outlines where the look wants them."""
    mats = set()
    for o in objects:
        if o.type != 'MESH': continue
        for m in o.data.materials:
            if m and not m.name.startswith('__'): mats.add(m)
    for m in mats: style_material(m, look)
    if look in ('toon', 'toon2'):
        for o in objects: add_outline(o, outline_px / PPM)
    elif look == 'ink':
        setup_freestyle(objects, outline_px)
    return mats

def setup_freestyle(objects, px):
    sc = bpy.context.scene
    sc.render.use_freestyle = True
    sc.render.line_thickness_mode = 'ABSOLUTE'; sc.render.line_thickness = 1.0
    vl = bpy.context.view_layer
    fs = vl.freestyle_settings; fs.mode = 'EDITOR'; fs.use_culling = True; fs.crease_angle = math.radians(140)
    for ls in list(fs.linesets): fs.linesets.remove(ls)
    ls = fs.linesets.new('ink'); ls.select_silhouette = True; ls.select_border = True; ls.select_crease = True
    ls.select_contour = True; ls.select_external_contour = True; ls.select_material_boundary = True; ls.select_edge_mark = True
    st = ls.linestyle; st.color = srgb_lin('#2a1a24'); st.thickness = px * TEX * 1.3; st.thickness_position = 'CENTER'
    st.caps = 'ROUND'
    # thicker on the outside contour, a little variation along the stroke so it feels hand-drawn
    m = st.thickness_modifiers.new('along', 'ALONG_STROKE'); m.value_min = px * TEX * 0.7; m.value_max = px * TEX * 1.6; m.blend = 'MIX'; m.influence = 0.6
    c = st.thickness_modifiers.new('calli', 'CALLIGRAPHY'); c.orientation = 35.0; c.thickness_min = px * TEX * 0.5; c.thickness_max = px * TEX * 1.9; c.influence = 0.5
    try:
        g = st.geometry_modifiers.new('wobble', 'PERLIN_NOISE_1D'); g.frequency = 8.0; g.amplitude = px * TEX * 0.35; g.octaves = 2; g.angle = 45.0
    except Exception: pass
    return ls

def setup_render(engine='BLENDER_EEVEE', samples=32, transparent=True):
    sc = bpy.context.scene
    # the startup file's cube, light and camera must not end up in a sprite
    for n in ('Cube', 'Light', 'Camera'):
        o = bpy.data.objects.get(n)
        if o: bpy.data.objects.remove(o, do_unlink=True)
    try: sc.render.engine = engine
    except TypeError as e: raise RuntimeError(str(e))
    sc.render.film_transparent = transparent
    sc.render.image_settings.file_format = 'PNG'; sc.render.image_settings.color_mode = 'RGBA'; sc.render.image_settings.color_depth = '8'
    sc.render.resolution_percentage = 100
    sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'; sc.view_settings.exposure = 0.0; sc.view_settings.gamma = 1.0
    sc.render.dither_intensity = 0.0
    try: sc.eevee.taa_render_samples = samples
    except Exception: pass
    try: sc.eevee.use_shadows = True
    except Exception: pass
    try: sc.render.use_freestyle = False
    except Exception: pass
    w = sc.world or bpy.data.worlds.new('World'); sc.world = w; w.use_nodes = True
    bg = next(n for n in w.node_tree.nodes if n.type == 'BACKGROUND'); bg.inputs[0].default_value = (0.55, 0.55, 0.6, 1); bg.inputs[1].default_value = 1.0
    return sc

def ortho_camera(cx, cz, width_m, height_m, res_w, res_h, name='__cam', y=-40.0):
    """An orthographic camera looking along +Y, framing x in [cx - w/2, cx + w/2], z in [cz - h/2, cz + h/2]."""
    sc = bpy.context.scene
    cam = bpy.data.objects.get(name)
    if cam is None:
        cam = bpy.data.objects.new(name, bpy.data.cameras.new(name)); sc.collection.objects.link(cam)
    cam.data.type = 'ORTHO'; cam.data.ortho_scale = max(width_m, height_m * res_w / res_h)
    cam.data.clip_start = 0.1; cam.data.clip_end = 500
    cam.location = (cx, y, cz); cam.rotation_euler = (math.pi / 2, 0, 0)
    sc.camera = cam; sc.render.resolution_x = res_w; sc.render.resolution_y = res_h
    return cam

def lights(look, key_dir=(-0.55, -0.6, 1.0), strength=None):
    """Key sun from the upper front-left (screen left), a soft fill from the right, a rim from behind for the paint look."""
    sc = bpy.context.scene
    for o in list(bpy.data.objects):
        if o.name.startswith('__light'): bpy.data.objects.remove(o, do_unlink=True)
    def sun(name, d, energy, color=(1, 1, 1), angle=6):
        L = bpy.data.lights.new(name, 'SUN'); L.energy = energy; L.color = color; L.angle = math.radians(angle)
        o = bpy.data.objects.new(name, L); sc.collection.objects.link(o)
        o.rotation_euler = Vector((0, 0, -1)).rotation_difference(Vector(d).normalized() * -1).to_euler()
        # a sun shines along its local -Z: point -Z at -d (light travels from d toward the origin)
        o.rotation_euler = (Vector(d).normalized()).to_track_quat('Z', 'Y').to_euler()
        return o
    e = strength or {'toon': 3.0, 'toon2': 3.0, 'paint': 2.6, 'ink': 3.0}[look]
    key = sun('__light_key', key_dir, e, (1.0, 0.96, 0.9))
    if look == 'toon2':
        # The inverted-hull outline is a closed shell around every part, and it casts shadows: with shadows on, the
        # whole character sits in its own outline's shadow and only the flat world fill lights it (why the first
        # Fiesta Toon sprites had no light side). toon2 lights without shadows (pure N.L cel bands) and turns the
        # world fill down so the key light shapes the form.
        key.data.use_shadow = False
        w = bpy.context.scene.world
        if w and w.node_tree:
            bg = next((n for n in w.node_tree.nodes if n.type == 'BACKGROUND'), None)
            if bg: bg.inputs[1].default_value = float(os.environ.get('AMBIENT', '0.35'))
        fill = sun('__light_fill', (-0.8, -0.4, 0.2), float(os.environ.get('FILL_E', '0.5')), (0.75, 0.8, 1.0), 20)
        fill.data.use_shadow = False; fill.data.specular_factor = 0.0
        return e
    if look == 'paint':
        sun('__light_fill', (0.8, -0.5, 0.3), 0.7, (0.75, 0.82, 1.0), 20)
        sun('__light_rim', (0.3, 0.9, 0.5), 1.6, (1.0, 0.8, 0.55), 4)
    elif look in ('toon', 'toon2'):
        sun('__light_fill', (0.8, -0.5, 0.3), 0.35, (0.8, 0.85, 1.0), 20)
    return e

def render(path):
    sc = bpy.context.scene
    os.makedirs(os.path.dirname(path), exist_ok=True)
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)
    return path

def mesh_bounds(objects):
    lo = Vector((1e9,) * 3); hi = Vector((-1e9,) * 3)
    dg = bpy.context.evaluated_depsgraph_get()
    for o in objects:
        if o.type != 'MESH': continue
        ev = o.evaluated_get(dg); me = ev.to_mesh()
        for v in me.vertices:
            w = ev.matrix_world @ v.co
            lo = Vector(min(lo[i], w[i]) for i in range(3)); hi = Vector(max(hi[i], w[i]) for i in range(3))
        ev.to_mesh_clear()
    return lo, hi

def all_meshes(root):
    out = []
    def walk(o):
        out.append(o)
        for c in o.children: walk(c)
    walk(root)
    return out
