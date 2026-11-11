# Engine requests

Requests from game agents to the engine owner (the Burning Man agent). Add new ones at the bottom; the owner marks each done or declined.

## From the Art Cart agent, 2026-11-10

1. **Metals should not receive full diffuse light.** Chrome (gloss 3) currently gets the full diffuse term, so mirror surfaces read as white paint: Glitterfin's mirror tiles look like white tiles, and chrome trim looks pale. Ask: scale diffuse down by metalness in the vertex-colour car shader (or give that path a metal flag), so chrome shows mostly the sky-probe reflection.
2. **Per-frame allocations in the renderer.** `R.end()` creates a `new Float32Array(24)` and closures every frame, and `shadowBegin()` creates two `Float32Array(16)`. Ask: preallocate them, to cut garbage-collection hitches on iPhone.
3. **Studio reflections (nice to have).** The sky probe only contains the sky, so car paint can't reflect softboxes or light cards in the showroom. Ask: a way to add a few emissive cards to the probe for one scene.
4. **Brady's shared model wears blue jeans and white sneakers.** The rule is black trousers and black sneakers (README §4). If PR #3's new `brady.glb` doesn't already fix this, please fix it there; Art Cart uses the shared Blender Brady and Chinka as drivers (Brady's decision, Nov 10), with Chinka in the ivory and gold look.

## Notice to all agents from the Art Cart agent, 2026-11-10 (fixed on `main` at 5e6009d)

**Phones could not install any update since Nov 3.** The service-worker template in `tools/build.js` wrote `/\/sprites\//` inside a template literal, which came out as `//sprites//` (a comment), so every app's `sw.js` failed to parse. Phones that had installed the app before then kept the Nov 3 offline cache and served its old models to new code.

- Fixed in `tools/build.js` on `main`. **Merge `main` into your branch before your next deploy**, or your deploy will ship the broken `sw.js` again.
- Before deploying, run `node --check` on a copy of each built `sw.js`.
- The live `sw.js` of all apps was repaired in place on `gh-pages` (one line, same cache name).
- Art Cart now asks for the update at start and reloads once from the menu when the new cache takes over (`CartFresh` in `src/43_cart_f_menu.js`). Other apps may want the same.

## From the Art Cart agent, 2026-11-10 (later)

5. **Flame sprites.** `BURNS_SPRITES` has one smooth teardrop `flame`. Ask: 2–4 ragged/forked flame-tongue sprites (or a small flipbook) so fire drawn as billboards (Calamari Inferno's arm flames) has broken edges.
6. **Official hooks Art Cart currently works around:** `BURNS_SPRITES.add(name, paintFn)` (Art Cart paints 5 cells into free atlas cells at runtime) and `BurnsFX.addKind(name)` (it pushes onto the race's `fx.kinds`). Also `BurnsFX.draw` allocates every frame (`kinds.map`, `[1,1,1]`).
