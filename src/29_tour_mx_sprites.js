/* ============================================================
   Mexico: the pre-rendered Fiesta Toon art (Blender; tools/blender/
   sprites/mx_*.py, packed by pack_atlas.py into assets/sprites/
   super-brady-o-world/mx*.png). Loads after 29_tour_mx.js and points
   the registered country at its atlases: background strips, floor
   tiles, enemy sprites. Everything falls back to the procedural art
   until an atlas has loaded, so the level never waits.
   ============================================================ */
(() => {
const C = Tour.countries.mx;
if (!C) return;
C.sprites = true; C.spritesWired = true;   // enemies with sprite ids draw from the 'mx' atlas; 30_tour_sprites.js skips Mexico
const layer = (atlas, id, f, fallback, shift) => ({ kind: 'image', atlas, id, f, fallback, shift: shift || 0, base: fallback.base, dyn: fallback.dyn, color: fallback.color });
const T = THEMES;
// 1-1 Mercado Mayhem
if (T.mx_mercado) {
  const old = T.mx_mercado.layers;
  T.mx_mercado.layers = [
    layer('mx_mercado', 'bg_far', 0.03, old[0]),
    layer('mx_mercado', 'bg_mid', 0.14, old[1]),
    layer('mx_mercado', 'bg_papel', 0.32, old[2]),
    layer('mx_mercado', 'bg_near', 0.45, old[3], -45)
  ];
  Atlas.applyTiles(T.mx_mercado, 'mx_mercado', { ground: 'ground' });
}
// 1-2 Xochimilco: volcano, willows and water, parked trajineras
if (T.mx_canal) {
  const old = T.mx_canal.layers;
  T.mx_canal.layers = [layer('mx_canal', 'bg_far', 0.02, old[0]), layer('mx_canal', 'bg_mid', 0.12, old[1]), layer('mx_canal', 'bg_near', 0.3, old[2], -40)];
  Atlas.applyTiles(T.mx_canal, 'mx_canal', { ground: 'ground' });
}
// 1-3 Cenote: the limestone wall (with the engine's light shafts over it), stalagmites and crystals
if (T.mx_cenote) {
  const old = T.mx_cenote.layers;
  T.mx_cenote.layers = [layer('mx_cenote', 'bg_cave', 0.08, old[0]), layer('mx_cenote', 'bg_stalag', 0.3, old[1], -40)];
  Atlas.applyTiles(T.mx_cenote, 'mx_cenote', { ground: 'ground' });
}
// 1-4 El Volcán: the erupting volcano (with the engine's smoke), agave rows
if (T.mx_volcan) {
  const old = T.mx_volcan.layers;
  T.mx_volcan.layers = [layer('mx_volcan', 'bg_far', 0.03, old[0]), layer('mx_volcan', 'bg_mid', 0.2, old[1], -30)];
  Atlas.applyTiles(T.mx_volcan, 'mx_volcan', { ground: 'ground' });
}
// 1-5 Hacienda (and its patio): the dusk volcano, the arcade with bougainvillea
for (const key of ['mx_hacienda', 'mx_hacienda_in']) if (T[key]) {
  const old = T[key].layers;
  T[key].layers = [layer('mx_hacienda', 'bg_far', 0.02, old[0]), layer('mx_hacienda', 'bg_arches', 0.15, old[1], -30)];
  Atlas.applyTiles(T[key], 'mx_hacienda', { ground: 'ground' });
}
// the item block (a paper piñata), the golden lime coin, the golden alebrije star: from the country's sprite atlas
for (const key of ['mx_mercado', 'mx_canal', 'mx_cenote', 'mx_volcan', 'mx_hacienda', 'mx_hacienda_in']) if (T[key]) Atlas.applyTiles(T[key], 'mx', { qblock: 'pinata_block_idle_000', used: 'pinata_block_used_000', keepAtlas: true });
if (C.coin && C.coin.draw) { const old = C.coin.draw; C.coin.draw = (ctx, x, y, t) => { if (!Atlas.animate(ctx, 'mx', 'lime/spin', t || 0, x, y, 1)) old(ctx, x, y, t); }; }
if (C.star && C.star.draw) { const old = C.star.draw; C.star.draw = (ctx, x, y, t) => { if (!Atlas.animate(ctx, 'mx', 'alebrije/idle', t || 0, x, y, 1)) old(ctx, x, y, t); }; }
// the cast: sprite ids match the kinds rendered by tools/blender/sprites (pepper_kind.py, mx_enemies_a/b.py)
const SPRITES = { mxPepper: 'pepper', mxElote: 'elote', mxBurro: 'burro', mxChihuahua: 'chihuahua', mxArmadillo: 'armadillo', mxSalsa: 'salsa', mxXolo: 'xolo',
                  mxAxolotl: 'axolotl', mxHeron: 'heron', mxFish: 'fish', mxBat: 'bat', mxLava: 'lava' };
for (const k in SPRITES) { const cls = ENTITY_TYPES[k]; if (cls && cls.cfg) cls.cfg.sprite = SPRITES[k]; }
})();
