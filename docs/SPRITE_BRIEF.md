# Brief: converting a country to the Fiesta Toon look (for art agents)

**Blender route (Brady's Mac, Blender 5.2.3, numpy, no PIL).** Background mode (`blender -b`) crashes there during
Metal detection, so every pipeline script runs in a PRIVATE windowed Blender instance started from the shell:
`tools/blender/sprites/gui/bl.sh <log> <script.py> [args after --]` (it runs
`Blender --factory-startup --python-exit-code 1 --python gui/driver.py`; `--factory-startup` keeps the user's add-ons,
including the Blender MCP server, out of it; the driver runs the script and quits; env vars such as JOB/OUT/KINDS pass
through; a window flashes briefly). One instance per job. Never drive the user's open Blender window or the Blender
MCP tools for this: another project may be using it, and the theme modules reset the scene. Helpers in `gui/`:
`compare.py` (frame-by-frame diff of two packed atlases), `frames.py` (crop frames out of an atlas), `sheet.py`
(contact sheet of atlas frames), `shoot.js` (Playwright in-game screenshots, full resolution, waits for atlases).
Do not edit anything under `src/` unless your task says so; create only the files named in your task. The player stays
the code-drawn Brady (`src/05_brady.js`): never render him in Blender.
Every design must be ORIGINAL (never a copy of any existing game's characters, blocks or scenery); keep the respect rules in
docs/WORLD_TOUR_GUIDE.md §11 (people and sacred things are background only). The chosen look is flat cel shading with a
dark outline: model chunky, readable low-poly shapes with clean silhouettes; plain Principled materials, Base Color only
(materials whose name contains `glow` render unlit). 1 m = 28.1 game px; the player is 1.85 m tall.

Reference implementations (read first): `tools/blender/sprites/mx_pepper.py` and `mx_enemies_a.py` (characters),
`mx_mercado.py`, `mx_canal.py`, `mx_cenote.py`, `mx_volcan.py` (backgrounds + tile-aligned floors), `lookkit.py`.
The data sheet `tools/blender/sprites/COUNTRIES.txt` lists every country's levels, themes (layer order, bases, colours)
and enemies (hitbox, behaviour). The country's own art is in `src/29_tour_<cc>.js` (painters, enemy art functions).

## A. Characters and items: one module `tools/blender/sprites/<cc>_enemies.py`
API (exact):
```
KINDS = [...]            # EVERY entity type of the country that draws a character, minus the country prefix, first letter
                         # lowercase (ecBanana -> 'banana'): the enemies, the friends (TourFriend, e.g. ecBooby), the
                         # boss's minions (e.g. brToucanito) and the CUSTOM-CLASS enemies (e.g. ecPuffer, brCoati), plus
                         # the four items: 'coin', 'star', 'qblock', 'used'
FRAMES = {(kind, pose): (n, fps)}   # optional: frame counts that differ from render_country.py's CYCLES
POSES = {kind: [...]}    # see the table
HEIGHT = {kind: metres}  # nominal height for feet-origin kinds (hitbox h / 28.1)
SIZE = {kind: metres}    # nominal size for centre-origin kinds (flyers, swimmers, leapers, items)
ORIGIN = {kind: 'feet' | 'centre'}
def build(kind, pose, t=0.0) -> root Empty named kind   # fresh geometry each call
def clear()                                              # removes everything the module built
```
Poses by behaviour (t in 0..1 is the cycle phase for the poses marked *): walk/hop/charge/throw/roll/still walkers with
feet origin: `walk*`, `stun`, `flat`, `ko` always; hop adds `hop`; charge adds `notice`, `charge`; throw adds `idle*`,
`throw*`; roll adds `curl`, `roll*`; still uses `idle*`. (2-hp enemies need no `hurt_walk`: the game never asks for it.) Flyers (place fly, centre
origin): `fly*`, `swoop`, `stun`, `ko`. Swimmers (place swim, centre): `swim*`, `ko`. Leapers (place here, centre): `up*`,
`down*`, `ko`. Friends (FRIEND, feet): `idle*`, `wave*`. Items (centre): `coin`: `spin*` (rotation about the vertical
axis), `star`: `idle*` (hover), `qblock`: `idle*` (the country's item block, a 32 px cube with a face or motif),
`used`: `idle` (the same block spent). The game draws the blocks from frame 000 only, so give them
`FRAMES = {('qblock', 'idle'): (1, 1), ('used', 'idle'): (1, 1)}`. The country's coin and star names are in the data
sheet; the item block must never be a question-mark block.
Custom classes: render every mode the class sets (`this.mode`, e.g. the coati's `flee`) and wire the class in the
country file: give it a static `cfg` (`BrCoati.cfg = COATI`) so `30_tour_sprites.js` names its sprite, and override
`drawArt` / `paint` only for what the generic draw can't know (the puffer picks `puffer_puff_000..003` by how puffed it
is; the coati draws its stolen coin; the booby faces Brady). Always keep the procedural art as the fallback.
Conventions: Z up, feet on z = 0 for feet origin, centred at the origin for centre origin, the character FACES +X; big
eyes and clear silhouettes that read at 24 px; materials named `<kind>_<part>`; every object parented to one Empty named
`kind` with `obj['sprite_part']`. Keep the art within ~30% of the hitbox.
Main guard (optional; previewing through `build_country.sh` with `KINDS=` plus `gui/sheet.py` is quicker): build every (kind, pose) at t = 0 (and 0.5 for cycles), render EEVEE previews (ortho camera at (0, -4, z)
looking +Y, ortho_scale 1.6, sun, transparent film, 512 px) and contact sheets per kind at 256 and 48 px into your scratch
folder. Look at them (Read tool) and iterate until every kind is charming and readable at 48 px.

## B. Backgrounds: one module per theme `tools/blender/sprites/<themeKey>.py` (for example `ec_equator.py`)
API (exact, same as mx_canal.py):
```
P = 36.4
LAYERS = ['L0', 'L1', ...]        # one per entry of the theme's layer list, in the same (back to front) order
BASES = {'L0': base, ...}         # the base rows from the data sheet
def build(seed=1) -> {layer: Collection}   # deterministic; clears first
def build_ground(seed=1) -> Collection 'ground'   # the theme's floor in its ground style (see below)
def clear()
```
Each layer: an original toon reinterpretation of what the engine's painter draws for that layer kind (read the painter in
the country file, or in `src/03_themes.js` for generic kinds like mountains, clouds, rocks, kelp, pines, forest), in the
layer's colour family. Built relative to its own ground line z = 0, periodic in x with period P (duplicate seam-crossers
at x ± P), y within ±6. Keep the interesting silhouettes between rows base-180 and base (the floor covers rows below
about 330); a layer with base 0 is a backdrop that hangs from z = 0 down ~16 m; layers with `dyn:` keep only their static
part (the engine animates the rest on top); `blur` far layers can be simpler. Material names must not clash with the
other themes you build in the same file set (prefix them with the theme key).
Floor: an 8 x 3 tile strip (period GP = 8 x 1.139 m, 3.42 m deep from z = 0 down), tile-aligned: nothing crosses a 1.139 m
boundary (margin >= 0.045 m), at most 2 elements per row and 2 rows per tile, a continuous cap band along the top of row 0,
chunky elements, lighter mortar. Match the ground style named in the data sheet (grass: turf cap over soil; snow: snow cap
over packed ice; sand; coral; marble; metal; brick; wood; or the country's own named style, read its painter).
Main guard: build, render each layer (1024x444, ortho camera at (P/2, -30, z) looking +Y, ortho_scale P, EEVEE,
transparent film, Standard view transform, ground row at BASES[layer]) plus a composite over the theme's sky colours and a
shuffled-tile ground preview, into your scratch folder; iterate on what you see.

## C. Report
File paths, KINDS/POSES or LAYERS/BASES, triangle counts, preview paths, anything the renderer needs to know.
The lead renders and packs with `tools/blender/sprites/build_country.sh <cc> [workdir] [enemies|<themeKey> ...]`
(`KINDS=a,b` renders a preview of a few kinds without packing). Atlases are lossy **WebP** with alpha
(`assets/sprites/super-brady-o-world/<name>.webp` + `<name>.js`; `pack_atlas.py` with `ATLAS_FORMAT=png` for PNG);
the build bakes the directory listing and the engine wires everything by name (`src/30_tour_sprites.js`). After a
re-pack, compare against the committed atlas (`gui/compare.py`), take in-game screenshots and look at them.
