# Art Cart visual refinement — November 5, 2026

## Authoritative Brady appearance

Brady's latest instructions override older descriptions in the character scripts and handoff:

- Man bun, pulled-back hair and a clean nape. No loose curtain of hair.
- Sacred geometry blackwork sleeves on both arms, including the forearms.
- Black T-shirt, black trousers and black sneakers. No blue denim.
- Dark square sunglasses.

Chinka retains long dark wavy hair, sunglasses, a brown top, black leggings, white sneakers and an LED necklace.

## Implementation

The driver treatment is in `src/43_cart_bc_driver_art.js`. It keeps the existing costume specifications,
16-joint animation rig, driver IDs and gameplay interfaces. Human faces use continuous modeled cheek/jaw
surfaces, noses, eyes and lips; headwear and hair scale together. Long hairstyles use curved volumetric
locks. Clothing has collar binding and seams. Nonhuman costumes retain their existing defining pieces.
The Man retains his deliberately sculptural design.

The three optional `spec.cartArt` hooks in `40_burns_da_round.js` are dormant for the adventure game's
characters. Art Cart marks its models with `cartArt`, so the shared Brady/Chinka character downloads cannot
silently replace these intentional designs after the menu has already loaded.

`43_cart_bc_car_finish.js` merges exposed wheel faces, rim lips, hubs, spokes and showroom sidewall detail
into the existing car buffers at load time. Existing wheel faces were inside the solid tire surfaces.
The same car rig, pivots and one-draw rendering path remain in use. Race models add 368 triangles each;
all twelve stay below 8,000 triangles (5,472–7,998 in the tested assets). Detailed showroom cars add more.
This finish requires no regenerated or additional model downloads.

The showroom uses a quiet blue-hour palette, dark ground and softer portrait rim lighting. Driver framing
keeps the standing preview inside the landscape screen. The circuit palettes separate road and background;
painted shoulders and road edges now follow local track width rather than using the first point's width
for the entire lap.

## Validation

```sh
node tools/build.js
node tools/cart_art_test.js
node tools/cart_shots.js shots/cart heart gp
```

The new smoke test checks all 26 driver meshes and driving poses, all 12 race-car meshes, the 16-bit
index and 8,000-triangle race-car limits, and loading plus one second of simulation in all eight tracks
and seven arenas. It does not substitute for the existing full battle-objective gameplay tests.

Observed: 26 drivers, 12 cars, 15 worlds, no page errors. A rendered eight-car Esplanade grid at
874 × 402 used 65 total draws and 350,320 main-pass triangles, within the documented medium-tier
120-draw / approximately 450k-triangle budget. These are headless renderer counts, not measured iPhone FPS.

Visually inspected the Brady and Chinka standing previews, Bass Valentine showroom and an eight-car race.
Local validation had all twelve race LODs and ten showroom LODs; the two larger original showroom binaries
were unavailable through the file connector, so their race versions supplied their preview fallback.
The repository's existing binaries are not replaced by this patch.

## Review and integration

This is an implemented refinement of the existing procedural art, not a new photorealistic character
asset set. It is a reviewable visual pass; professional-quality final sign-off still needs visual review
and a real-device playthrough. Keep gameplay changes in their existing lanes. Merge this source change,
build the complete repository, and deploy the resulting site through the normal Pages workflow.
