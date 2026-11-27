# Postcard rewards (26 Nov 2026)

Brady: "What happens if I get all of the postcards from Chinka? It doesn't seem like much happens when I get them."

Before this, a postcard was worth 5,000 points, a pip on the map, and the World 22 door (22 postcards). Finding all three in a level, every card in a land or every card in the game did nothing. Code: `src/29_tour_zz_postcards.js` (wraps the engine, changes no level). Test: `tools/sbw_postcards_test.js` (Node), shots: `tools/sbw_postcards_shots.js`.

## The ladder

| Found | What happens |
|---|---|
| The third card of a level | "ALL 3 POSTCARDS!" over Brady. On the results screen the three cards fan out and an ALL 3! postmark thumps down; the **first** time: **+1 life** (a pink tag, FROM CHINKA-O). Later clears show a small ALL 3 stamp only. The level's stop on the land map wears a postage stamp instead of three little cards. |
| Every card in a land | Chinka-O sends a **care package**: a card on the map (a parcel, a one-line joke about the land in her hand, what is inside). The land's pin on the world map gets a gold stamp. It holds the next perk of the track below. |
| Every card in the game | Three story panels (her letter), the **Golden Cape**, and `Save.data.allPostcards = true`. |

## The reward track

One track, in the order lands are completed (any land can be first), cosmetics and helpers alternating:

1. **Postcard Cape** (look): a cream cape printed with stamps, behind Brady; flaps with speed.
2. **Postcard Compass** (helper): an arrow at the screen edge to the nearest postcard still missing in the room.
3. **Golden Shades** (look): a glint runs over his shades every few seconds.
4. **Gift Box** (helper): each level (not a checkpoint respawn) starts with a gift on a little parachute: a Magic Mushroom when small, a Joint when big.
5. **Heart Trail** (look): little pink hearts when he runs.
6. **Magnet Start** (helper): the Magnet Belt for the first 20 s of a level.
7. **Stamp Steps** (look): a passport postmark where he lands.

From the 8th land on, each care package holds **+3 lives**. Every postcard: **Golden Cape** (replaces the cape's print with gold and a pink heart).
Brady stays recognisable: nothing touches his tee, trousers, bun or square shades; nothing has national or religious meaning. Every perk switches on/off on the album's perks page (Settings > POSTCARD PERKS opens it). Helpers make a level easier only a little (one power step, a coin magnet); none touches enemies, timers or pits.

## The album

POSTCARD ALBUM: the title's progress chip (and its ALBUM tag), the land map's pause menu, a tap on the land chip (top left of a land map), Settings > POSTCARD PERKS. Page 1: the care packages (the track, switches, her letter once everything is found). Then one page per land in route order: every level with its three cards, a missing one as a dotted outline with the level id written in it, a stamp on a full level; the land's care package note (or what the next box holds). Hidden lands are "?" pages; unrevealed secret levels are a line ("+ a secret level not found yet").
Counts: the album's header is `TourProgress.totals()` (gold / goldTotal), the same as the world map, the title chip and the credits; each page lists the same levels as the land chip on its map (revealed ones, plus any with a card found). `sbw_postcards_test` checks this.

## Save
`Save.data.postcards = { v, levels: {id}, lands: {cc: k}, order: [cc], pending: [cards], off: {perk}, all, story }`, made on first use (old saves have none; the save key is unchanged). `Save.data.allPostcards` mirrors `all` and never goes back to false. `TourPostcards.all()` is the helper for a future hidden land (not built).
A land counts every level in it, secret levels included. Lives are capped at 99.

## Old saves
The first load of a save without `postcards` grants everything already earned (a life per full level, the lands' perks in route order, the Golden Cape if complete) and queues **one** summary card ("Chinka-O caught up on her mail") for the next map visit; no per-land cards, no story (her letter is in the album). Nothing is ever taken away; a reload grants nothing twice.
