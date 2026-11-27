# Super Brady-O World: relay for the road to 200 (27 Nov 2026)

*Brady pastes this into a fresh chat. It is written for the next Claude.*

## Who you are working for
Brady (GitHub `bradymott`) owns the game, plays it on an iPhone 17 and is not a programmer. Talk plainly, show screenshots not code, and say exactly what he should try. He likes the main session organising Opus builders for heavy work. He is happy, engaged and sends long voice-typed feedback: act on every point and tell him what you did with each.

## Read first, in the repository `bradymott/brady-o`
1. `docs/handoff/SBW_RELAY.md`: the state of the game, the rules that must hold, how to deploy. The entries for 25 and 27 Nov are this chat's work.
2. `docs/design/ENCORE_TOUR.md`: how the last five lands were specified (use it as the model for a land brief).
3. `docs/design/CHATGPT_RELAY.md`: ChatGPT's ideas document. Section A = the twelve hidden lands (levels, bosses, critters, entrances); B = 60 secret-room mini-games; C = prize boxes (built); D = Chinka-O's care-package notes and captions; F = which mini-game goes with which stage, and eight extra rooms.
4. `docs/design/chatgpt_lands/`: `SHEET_KEY.md` (official names of every critter, boss and block, and how each entrance is entered), `README.md` (what each picture shows), and three pictures per land (`cast.jpg`, `building-blocks.jpg`, `entrance.jpg`). Reference only: redraw in the game's code-drawn style.
5. `docs/design/POSTCARD_REWARDS.md`, `docs/design/SECRET_ROOMS.md`, `docs/design/TOOLKIT_STATUS.md`.

## Where the game is
- Live at https://bradymott.github.io/brady-o/super-brady-o-world/ : 132 levels in 22 lands. Save key `super-brady-o-world-save-v5`; no reset has been needed and Brady's save must keep working.
- `main` holds everything live. This chat worked on branch `claude/pensive-babbage-c4pt8q`, fully merged into `main`.
- She is **Chinka-O**. Brady tried a rename and reversed it the next day. Do not rename anyone.

## The job: 132 to 200 levels
Brady's words: "let's make this 200 levels", "secret worlds that you can only access by finding hard to find things", "make a few that are really hard to find and have lands that you can only access by finding the really hard ones", climbing "on the cages, up and down and around the enemies", "every secret room different", "you don't always exit out the entry door", "I like puzzles".

Build ChatGPT's twelve hidden lands: A1 to A8 have six stages each, A9 to A12 five each, 68 stages, each land's last stage its boss. Every stage is a new kind of play with a stick, JUMP and RUN/THROW only, and has its own secret room from section B/F.

Suggested order, four lands a round, each round deployed so Brady can play along:
1. **A1 Wrong Side of the Wash** (the climbing land he asked for), **A7 Pupo Standard Time**, **A11 Table for Two**, **A12 The Spare Bone Quarry**.
2. A2 Postmark Sound, A3 The Orchard After Closing, A6 The Umbrella Repair District, A10 The Department of Unclaimed Shadows.
3. A4 Foley Beach, A5 The Unflattering Gallery, A8 Below the Cheap Seats, A9 The Table Salt Sea.

### Decisions already made for these lands
- **Hidden lands, hidden entrances.** Each is a bonus land (as The Red-Eye and Lost & Found are: `Tour.addStop`, `secret: true, bonus: true`) that does not appear on the route map until its entrance is found. The entrance sits in an existing land's level with exactly ONE subtle clue, as `SHEET_KEY.md` describes, and is entered the way it says. Fair, never signposted. Pick the host level so the clue is on a route a curious player passes.
- **A reason to hunt:** `TourPostcards.all()` / `Save.data.allPostcards` exist for gating a final secret; the postcard album can show a "?" page for each undiscovered land. ChatGPT's idea of Pupo's saddle blanket collecting one object per discovered land is approved in spirit.
- **Change from the concept art:** the Gallery's portraits and boss are Piwi Squirmin' (never a real-looking person); far-off towers, spires and strings of coloured flags in the entrance concepts become plain shapes or are left out; Pupo is the game's own Pupo.
- **Controls:** simplify anything in ChatGPT's text that needs more than a stick and two buttons (hold-and-peel, record-and-trim).
- **Use Chinka-O's care-package notes** from section D where they beat the placeholder jokes in `29_tour_zz_postcards.js`, and add notes for the new lands.
- **Prize boxes** for the new lands are on each `building-blocks.jpg` (full and empty): add them to `29_tour_zz_boxes.js`.
- **Difficulty:** these come after the Moon in a player's journey but can be found early. Aim each land at about Nepal's level, fair for a thumb, with the last stage and the boss the hardest.

## How this chat worked (it worked well)
- One Opus builder per land, each in its own git worktree and branch, from a written brief (the briefs this chat used are saved as `docs/handoff/LAND_BUILDER_BRIEF.md`, `SECRET_ROOMS_BRIEF.md` and `FIX_JOB_BRIEF.md`: adapt the paths). Builders commit, never push. The main session reads each report, **opens the screenshots itself**, sends the builder back with a fix list, merges, runs the suite, deploys.
- Shared files conflict on merge in the same few places every time: `src/28_tour_sc_hats.js`, `tools/sbw_hits_test.js`, `tools/sbw_rooms_test.js`. Tell builders to add one commented block each and resolve by keeping both.
- Browser tests run one at a time across all builders (a lock folder). The whole-game level check takes about 25 minutes on a cloud machine; builders check only their own levels.
- **What the main session caught by looking, every time:** rooms whose game sat under the on-screen stick and buttons or the top bar; two rooms in a land sharing one backdrop; overlapping toasts and counters; a timing window too tight for a thumb. Put these in the brief: *a room's game must fit one 844x390 view in the middle band, clear of the top bar, the stick (bottom-left) and the buttons (bottom-right); every room its own place; if the builder's own test player needs retries, widen it.*
- A cloud session has Chromium only: nothing has been run on WebKit or a real iPhone since 18 Nov. Say so each time, and ask Brady about lag.
- Going live needs Brady's say-so in a cloud session the first time; after that he has asked for each finished batch to be pushed live. Deploy steps are in `SBW_RELAY.md` ("How to work safely"); `rsync` may be missing: replace the `super-brady-o-world/` folder on `gh-pages` by copying.

## Small things still open
- Souvenir Stands, Wormholes and Pupo levels for Italy, Kenya, Australia, Iceland and the Moon (the level check warns "lands without a warp").
- The opera-hats room in Italy 14-4 still draws the shared white cups instead of top hats.
- The Encore lands' invincibility stars: suggested moves from the carry job (14-1 add at about 55%, 17-2 move to about 45%, 18-1 move to about 58%; 17-4, 14-2, 18-2, 18-3, 18-4 have none).
- The Moon's own full-run test player could not finish 18-1, 18-3 and 18-4 with enemies on: least proven land. Ask Brady how it plays.
- The lamp order in `lamps` rooms comes from a sort-based shuffle that differs between JS engines (harmless; each engine is self-consistent).
- Brady has not yet said whether he likes the title music (`sbw_title`).
- ChatGPT's remaining ideas (section E): the three postcards of a level joining into one little picture; a discovered entrance leaving a lasting change in its host land.
