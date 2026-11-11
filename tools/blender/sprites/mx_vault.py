# mx_vault: the 1-1 cellar lane's backdrop decor ('mxVault' in 29_tour_mx_levels.js): one 8 x 4-tile bay of the
# brick vault under the market street, drawn behind the walkway every 8 tiles. Packed into the mx_bodega atlas
# (see mx_bodega.py for the command) as vaulta_idle_000 (with a hanging lantern) and vaultb_idle_000 (without).
#   a dark brick wall (32 x 16-px bricks, so neighbouring bays line up), a deep arched niche with a voussoir rim and a
#   shelf of glass jars, the dark canal water along the foot (the game draws its moving glints on top).
# Feet origin at the bottom centre of the bay; the bay is 9.11 m (256 px) wide and 4.77 m (134 px) tall.
import math
import os
import random
import sys

import bpy
import bmesh
from mathutils import Matrix, Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ma_kit as K

PX = 28.1
KINDS = ['vaulta', 'vaultb']
POSES = {'vaulta': ['idle'], 'vaultb': ['idle']}
FRAMES = {('vaulta', 'idle'): (1, 1), ('vaultb', 'idle'): (1, 1)}
ORIGIN = {'vaulta': 'feet', 'vaultb': 'feet'}
HEIGHT = {'vaulta': 4.45, 'vaultb': 4.45}
W = 256 / PX
H = 134 / PX
PALETTE = {
    'wall': '#4a281a', 'brick_a': '#5e3422', 'brick_b': '#54301e', 'brick_c': '#663a26', 'niche': '#1e100c',
    'rim': '#a8704a', 'rim2': '#94603e', 'shelf': '#6a3e1c', 'jar': '#a8c0c8', 'lid': '#8a5a34',
    'j_red': '#c84a2a', 'j_orange': '#e8a83a', 'j_green': '#5a8a3a', 'j_pink': '#d86a8a', 'j_cream': '#e8d8a8',
    'water': '#123a44', 'water_hi': '#1e5664', 'lamp_metal': '#3a2a1a', 'lamp_glow': '#ffc870', 'cord': '#3a2a1a',
}
COLL_NAME = 'vault_parts'


def _coll():
    c = bpy.data.collections.get(COLL_NAME)
    if c is None:
        c = bpy.data.collections.new(COLL_NAME)
        bpy.context.scene.collection.children.link(c)
    K.COLL[COLL_NAME] = c
    return c


def clear(kind=None):
    for k in KINDS:
        root = bpy.data.objects.get(k)
        if root is not None:
            for ob in list(root.children_recursive) + [root]:
                me = ob.data if ob.type == 'MESH' else None
                bpy.data.objects.remove(ob, do_unlink=True)
                if me is not None and me.users == 0:
                    bpy.data.meshes.remove(me)


def build(kind, pose='idle', t=0.0):
    clear()
    K.use('mx_vault_' + kind, PALETTE, [COLL_NAME])   # one material set per kind: each is built once
    _coll()
    rng = random.Random(7 if kind == 'vaulta' else 11)
    root = bpy.data.objects.new(kind, None)
    bpy.context.scene.collection.objects.link(root)
    parts = []
    # wall: a hair wider than the bay so neighbouring bays overlap (no seam), never outlined
    Wl = K.Builder(kind + '_wall', COLL_NAME)
    Wl.box('wall', (0, 2.0, H / 2), (W + 0.06, 0.4, H), bevel=0.0)
    parts.append((Wl.done(period=None), 0))
    Bk = K.Builder(kind + '_bricks', COLL_NAME)
    bw, bh = 32 / PX, 16 / PX
    for r in range(8):
        z = H - (r + 0.5) * bh
        if z - bh / 2 < 0.45:
            continue
        off = (bw / 2) if r % 2 else 0.0
        for k in range(-1, 9):
            x0 = -W / 2 + k * bw + off
            xa, xb = max(-W / 2, x0 + 0.04), min(W / 2, x0 + bw - 0.04)
            if xb - xa < 0.1:
                continue
            Bk.box(rng.choice(('brick_a', 'brick_b', 'brick_c')), ((xa + xb) / 2, 1.75, z), (xb - xa, 0.15, bh - 0.08), bevel=0.02)
    parts.append((Bk.done(period=None), 0))
    # the vault niche (radius 70 px, centred 50 px under the top) and its voussoir rim
    Nc = K.Builder(kind + '_niche', COLL_NAME)
    r0 = 70 / PX
    cz = H - 0.2 - r0
    Nc.arch('niche', (0, 1.4, 0.0), 2 * r0, cz + r0, 0.2, segs=16)
    parts.append((Nc.done(period=None), 0.5))
    Rm = K.Builder(kind + '_rim', COLL_NAME)
    nv = 11
    for k in range(nv):
        a = math.pi * (k + 0.5) / nv
        px, pz = math.cos(a) * (r0 + 0.12), cz + math.sin(a) * (r0 + 0.12)
        if pz > H - 0.05:
            continue
        Rm.box('rim' if k % 2 else 'rim2', (px, 1.2, pz), (0.5, 0.25, 0.26), bevel=0.04, rot=(0, -(a - math.pi / 2), 0))
    for s in (-1, 1):
        Rm.box('rim', (s * (r0 + 0.12), 1.2, (cz + 0.45) / 2), (0.24, 0.25, cz - 0.45), bevel=0.03)
    parts.append((Rm.done(period=None), 0.7))
    # a shelf of jars in the niche
    Sh = K.Builder(kind + '_shelf', COLL_NAME)
    sz = 58 / PX
    Sh.box('shelf', (0, 1.25, sz), (2 * r0 - 0.4, 0.4, 0.16), bevel=0.02)
    for k in range(6):
        jx = -50 / PX + k * 20 / PX
        h = (14 + ((k * 7 + (3 if kind == 'vaultb' else 0)) % 10)) / PX
        rr = 0.22
        Sh.lathe('jar', [(rr * 0.8, 0.0), (rr, h * 0.15), (rr, h * 0.8), (rr * 0.7, h * 0.92), (rr * 0.7, h)], 10, at=(jx, 1.1, sz + 0.08), cap_top=True, cap_bottom=True, smooth=True)
        fill = ('j_red', 'j_orange', 'j_green', 'j_pink', 'j_cream')[(k + (2 if kind == 'vaultb' else 0)) % 5]
        Sh.lathe(fill, [(rr * 0.78, 0.02), (rr * 0.9, h * 0.15), (rr * 0.9, h * 0.65)], 10, at=(jx, 1.02, sz + 0.08), cap_top=True, cap_bottom=True, smooth=True)
        Sh.lathe('lid', [(rr * 0.75, 0.0), (rr * 0.75, 0.08)], 10, at=(jx, 1.1, sz + 0.08 + h), cap_top=True, cap_bottom=True)
    parts.append((Sh.done(period=None), 0.5))
    # the dark canal water behind the walkway
    Wt = K.Builder(kind + '_water', COLL_NAME)
    Wt.box('water', (0, 1.0, 0.25), (W + 0.06, 0.3, 0.5), bevel=0.0)
    Wt.box('water_hi', (0, 0.8, 0.47), (W + 0.06, 0.1, 0.05), bevel=0.0)
    parts.append((Wt.done(period=None), 0))
    if kind == 'vaulta':
        Lm = K.Builder(kind + '_lamp', COLL_NAME)
        lx = -W / 2 + 10 / PX
        Lm.rod('cord', (lx, 0.6, H), (lx, 0.6, H - 26 / PX), 0.03, segs=4)
        top = H - 26 / PX
        Lm.box('lamp_metal', (lx, 0.6, top - 0.04), (0.5, 0.3, 0.08), bevel=0.0)
        Lm.box('lamp_glow', (lx, 0.6, top - 0.3), (0.38, 0.26, 0.44), bevel=0.04)
        Lm.box('lamp_metal', (lx, 0.6, top - 0.56), (0.48, 0.3, 0.08), bevel=0.0)
        parts.append((Lm.done(period=None), 0.8))
    for ob, ol in parts:
        ob.parent = root
        ob['outline'] = ol
    return root
