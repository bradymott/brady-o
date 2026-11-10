# Start here: handoff for the next agents (November 2026)

Three agents now finish the three games, one agent per game. **Read this file first, then your own game's file:**

| Game | Your handoff | Live app |
|---|---|---|
| Art Cart | [ART_CART.md](ART_CART.md) | https://bradymott.github.io/brady-o/art-cart/ |
| Super Brady-O World | [SUPER_BRADY_O_WORLD.md](SUPER_BRADY_O_WORLD.md) | https://bradymott.github.io/brady-o/super-brady-o-world/ |
| Brady Goes to Burning Man | [BURNING_MAN.md](BURNING_MAN.md) | https://bradymott.github.io/brady-o/burning-man/ |

## 1. The owner
**Who he is.** Brady (GitHub `bradymott`) plays on an iPhone and isn't a programmer.
- Talk to him plainly.
- Show screenshots, not code.
- Ask before big or irreversible steps.

**His goal.** Games that are as polished as possible. Graphics are his top priority.

**Decisions he has already made:**
- **No Unreal Engine.** Everything stays a web app (a PWA on GitHub Pages). Blender is the art tool.
- **Super Brady-O World uses the "Fiesta Toon" look:** flat cel shading with dark outlines. Brady wants the player character there to stay the **code-drawn Brady**; he found the Blender-rendered one ugly.
- **His user guide.** The "Blender Graphics Playbook" is a Claude doc he reads. Its contents are reflected in these files.

## 2. Who has worked on this repo, and what is waiting for you
1. **Cloud Claude session (Nov 1–3):** built all three games and the shared 3D engine, and wrote the docs in `docs/`.
2. **Local Claude session on Brady's Mac (Nov 3), already on `main`.** It added:
   - a glTF pipeline: the `BurnsGLTF` loader, skinned characters and textured PBR (`docs/BURNS_GUIDE.md` §6.8–6.10)
   - Blender models for all 12 Art Cart cars and six Burning Man props
   - rigged Brady and Chinka with 19 clips each
   - seven Art Cart battle arenas
   - Super Brady-O World's Fiesta Toon pipeline: Mexico fully converted, plus Ecuador, Brazil and Mozambique art and a redesign of all 14 bosses
   
   Its notes are in `docs/HANDOFF_LOCAL_AGENTS.md`, `docs/ART_CART_GLTF_PILOT.md`, `docs/SPRITE_BRIEF.md` and `docs/BOSS_REDESIGN.md`.
3. **ChatGPT (Codex), Nov 5: three OPEN, UNMERGED pull requests, one per game.** None is deployed. Each has its own notes file **on its branch** (read it with `git show origin/<branch>:<path>`):

| PR | Branch | Notes file on that branch | Game |
|---|---|---|---|
| #1 | `codex/art-cart-visual-refinement` | `docs/ART_CART_VISUAL_POLISH.md` | Art Cart |
| #2 | `codex/super-brady-o-graphics-pass` | `docs/GRAPHICS_PASS_HANDOFF.md` | Super Brady-O World |
| #3 (draft) | `codex/burning-man-graphics-pass` | `docs/BURNING_MAN_GRAPHICS_PASS.md` and `docs/CINEMATICS_MAN_AND_MOVEMENT.md` | Burning Man (plus engine and Art Cart's Man) |

All three branch from `main` at `823a4d9`. ChatGPT's own notes say its browser tests were incomplete: some runs stalled, it never tested on an iPhone, and #2 was never run in a browser. **Review and re-test each one; don't trust it blindly.**

**Merge order (the PRs overlap):**
1. **#3, Burning Man, first.** It is the biggest and changes the shared engine.
2. **#1, Art Cart, second.** It shares `src/40_burns_da_round.js`, `src/43_cart_c_world.js` and `src/43_cart_f_menu.js` with #3. The Art Cart agent resolves those conflicts.
3. **#2, Super Brady-O World, any time.** Its only clash is `tools/graphics_test.js`, which #3 also adds. Whichever lands second renames its copy (e.g. `tools/sbw_graphics_test.js`).

If you are running in parallel and #3 hasn't landed yet, the Art Cart agent waits, or coordinates with the Burning Man agent through Brady.

## 3. Ownership: who may edit what
| Area | Owner |
|---|---|
| `src/40_burns_*`, `src/41_burns_*` (the shared 3D engine), `src/42_burns_*` (Burning Man worlds), `assets/models/burning-man/`, `assets/models/shared/` (Brady and Chinka) | **Burning Man agent** |
| `src/43_cart_*`, `assets/models/art-cart/`, `tools/cart_*` | **Art Cart agent** |
| `src/03`–`src/30` (2D engine, world tour, sprites), `assets/sprites/`, `tools/blender/sprites/`, `tools/validate_levels.js`, `tools/gameplay_test.js`, `tools/boss_test*` | **Super Brady-O World agent** |
| `src/00_core.js`, `01_audio.js`, `02_input.js`, `99_main.js`, `tools/build.js`, `tools/apps_test.js` | Shared. Make small additive edits only. In `build.js`, touch only your own app's entry. |

**Art Cart runs on the Burns engine**, so engine changes can break it, and the shared Brady and Chinka models appear in Art Cart as drivers.
- The Burning Man agent runs Art Cart's smoke test after any engine change.
- The Art Cart agent asks for engine changes rather than making them. Write the request in `docs/handoff/REQUESTS.md` and tell Brady.

## 4. Brady and Chinka: the appearance rules (latest wins)
- **Brady:**
  - man bun, hair pulled back with a clean nape (no loose curtain of hair)
  - dark square sunglasses, stubble
  - black T-shirt, black trousers and black sneakers (no blue denim)
  - sacred-geometry blackwork sleeve tattoos on both arms, forearms included
- **Chinka: CONFLICT, ask Brady.** The original spec and ChatGPT's Art Cart notes say long dark wavy hair, sunglasses, a brown tee or top, black leggings, white sneakers and an LED necklace. ChatGPT's Burning Man pass instead gave her ivory fabric, a pleated skirt and gold accents. Show Brady both and let him choose before more Chinka work.
- **Treat both warmly.** They're real people: Brady and his wife.

## 5. Ground rules (full list in `docs/HANDOFF_LOCAL_AGENTS.md` §2)
- **Original content only.** Never copy Nintendo or any other game, even "renamed".
- **Real camps and art cars** appear as layouts and generic structures with our own decor. Real DJs are name-drops only.
- **No brand names.** Note that "Burning Man" and "Costco" are trademarks; that's fine for the personal website, but flag them before any commercial release.
- **PG-13 satire.** Use cartoon censoring. Drug items are cartoon pickups, never instructional.
- **Countries:** humour comes from food, animals, objects and folklore. Never caricature people or sacred figures and sites.

## 6. Build, test, deploy
```bash
node tools/build.js          # dist/site/: launcher + burning-man/, super-brady-o-world/, art-cart/
node tools/apps_test.js      # all three apps boot (names, save keys, zero errors)
```

**Testing:**
- Each game file lists its own suites.
- Build privately with `BRADY_DIST=/some/dir` when several agents share a machine.
- Write big files elsewhere, run `node --check`, then move them into `src/`. A half-written file breaks every app's build, because the files are joined into one script per app.
- **Look at screenshots, not just error counts.** A visual regression once passed every error check.

**Git:** work on your own branch (`art-cart/…`, `sbw/…`, `burning-man/…`) with small commits. Merge to `main` only after your suites and `apps_test.js` pass. Never force-push `main`.

**Deploy:** only one agent at a time; tell Brady first.
1. Build from up-to-date `main` with every asset present.
2. Run `apps_test`.
3. Copy `dist/site/*` onto the root of the `gh-pages` branch, using a worktree.
4. Commit and push. GitHub Pages redeploys in about a minute.

## 7. Practical notes
- **Blender on Brady's Mac (5.2.3) crashes in background mode** (`blender -b`) during Metal detection. Run scripts inside an open Blender window instead: in its Python Console, `import runpy; runpy.run_path('/abs/path/script.py', run_name='__main__')`. Blender MCP also works for live edits. Only one agent at a time may drive the open Blender window.
- **Still owed by Brady:**
  - face scans and reference photos for realistic Brady and Chinka, going into `private/scans/` (git-ignored, never committed)
  - Mixamo animation clips
  Ask him when your work needs them.
- **iPhone budgets** (medium tier): about 120 draw calls and about 450k visible triangles, with steady 60 fps. No one has measured real-iPhone frame rates yet. Do that early.
