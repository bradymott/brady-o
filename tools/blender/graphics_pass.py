"""Rebuild the graphics-pass assets in a dedicated Blender scene.

Run with Blender -b -P tools/blender/graphics_pass.py, or from an already-open
Blender Python Console with runpy.run_path(<absolute path>, run_name='__main__').
The latter avoids the affected macOS background-startup Metal crash.
This replaces the current scene; use a dedicated Blender window/file.
"""
import os
import runpy
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from charkit import clear_scene

for name in ('brady', 'chinka', 'bm_rv', 'bm_bus', 'bm_shade', 'bm_dome', 'bm_tipi', 'bm_potty'):
    clear_scene()
    runpy.run_path(os.path.join(HERE, name + '.py'), run_name='__main__')
