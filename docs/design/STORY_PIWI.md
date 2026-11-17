# Super Brady-O World: the new story (Piwi Squirmin' and Chinka-O)

Design spec, 16 Nov 2026, written from `origin/main` at `ab95358`. Brady's request, in his words:

> "the villain should not be the Baron he should be Piwi Squirmin' and he should look like a peewee herman-esque ventriloquist dummy and he wants to steal Brady-O's beloved wife Chinka-O away from him so he takes her around the world and brady-o is chasing him trying to catch him and get his wife back"

**Phase A (this branch, `sbw/story-piwi`).** This document plus code-drawn art for the new cast in four new files: `src/05b_piwi.js`, `src/05c_chinka.js`, `src/05d_showtrunk.js` and `src/05e_pupo.js`. Nothing in the game references them yet, so the game is unchanged. Contact sheets: `node tools/story_preview/sheet.js <dist>/site <outDir>`.

**Phase B (after the other agents' branches merge).** Apply §7, the replacement table, in the order of §8.

Ground rules this story keeps:
- Piwi is our own character. He is a wink at the prim, giggly man-child showman type, not a lookalike.
  - No real character's trademark outfit or colour scheme, face, catchphrases, laugh or show material.
  - He is creepy-funny, never frightening.
- Chinka-O is Brady's real wife. She is written and drawn warmly, as a flattering cartoon of a real, loved person, and she is never a helpless prize.
- Pupo, her giant sloth and Brady-O's sidekick and steed, is gentle: his belly-button poke is sweet and PG, and his pointing hand always points with the index claw.
- Piwi's motive is silly and PG: he is a lonely dummy who wants a leading lady for his show. Nothing sleazy, nothing menacing toward her.
- The chase is our own structure (§3.1), not "the villain carries the princess from castle to castle".
- Humour comes from food, animals, objects and folklore. No real people or cultures are caricatured, and there are no brands.
- Brady-O's look is fixed: man bun, dark square shades, no stubble, black tee and trousers, blackwork sleeves.

---

## 1. Piwi Squirmin' (the villain)

### Look (`src/05b_piwi.js`)
A wooden ventriloquist dummy who walks and talks on his own. Nobody is working him, and that is the joke. He is about nine tenths of Brady-O's height, with the big head of a dummy.

| Part | Design |
|---|---|
| Head | Big, round, lacquered pale maple with a gloss highlight. A **hinged jaw**: two jaw slots run from the mouth corners down past the chin, and when he talks the whole jaw block drops and clacks shut. |
| Face | Round glassy marble eyes with teal irises that **glance sideways** (and snap from side to side when he is idle). Thin painted arched brows. Painted rosy cheek circles, a little peg nose and a crisp painted grin. |
| Hair | A glossy painted **copper** helmet with a side parting and one carved curl over the forehead. |
| Clothes | A **too-small magenta pinstripe jacket**: cropped hem, shirt showing underneath, one straining button with stress lines, and sleeves that stop halfway down the forearm. A cream shirt and a **lemon-yellow polka-dot bow tie**. **Teal trousers** that stop short of his wooden ankle dowels. Dark lace-ups with yellow laces. |
| Dummy gags | Peg joints at the wrists, and **snipped strings** trailing from both wrists (a reminder he was never a marionette either). A **brass pull-ring** sticking out of his back that nobody pulls. A neck dowel on a coiled spring: when he is startled, his head pops up on it. |

**Palette** (`PIWI` in the file): wood `#f2c79c`, copper hair `#c4501e`, jacket `#d6307a`, bow tie `#ffd23a`, trousers `#1d6e74`, ink `#1c1426`. The magenta, yellow and teal mix keeps one strong colour against every backdrop: magenta against sky, sea, snow and jungle; teal and yellow against the deserts and the purple nights. He is also inked like Brady.

**Deliberately unlike the reference:**
- not a grey suit, not a red bow tie, not white shoes, not dark slicked hair
- no catchphrases and no signature laugh from any show
- the face is a doll's face, not a person's

**Poses:**

| Pose | What it shows |
|---|---|
| `idle` | A prim little sway, with eyes snapping side to side. |
| `walk` | A scuttle: short stiff steps, floppy knees, a head that bobbles. |
| `talk` | The jaw clacks and one hand gestures. |
| `gloat` | One hand on his hip and the other fanned under his chin, head back, laughing with smug half-lids. |
| `startled` | Off the floor with everything flung out, the head popped up on its spring, wide eyes. |
| `defeated` | Slumped where he fell, like a dummy nobody is holding: legs out, head lolled, jaw hanging, spiral eyes. |

`Piwi.head()` draws the head alone, for bobble toys, portraits and the map. `Piwi.badge()` draws his "P" monogram on a magenta disc, for flags, signs and stamps.

### Personality and voice
He is a prim, giggly, theatrical show-off who is desperately lonely, and he has decided the whole world is his audience.
- He speaks in exclamations and stage directions, and calls everything "the show".
- His jaw clacks at the end of every sentence ("...*clack*"). That clack is his only verbal tic: no laugh catchphrase.
- He calls Brady-O **"Mister Bun"** and Chinka-O **"my leading lady"**. She corrects him every time ("Mrs.").
- He is vain about his lacquer and his curl. He is terrified of termites, woodpeckers, beavers, campfires and woodchippers.
- He is light: a strong wind blows him about.
- He is never cruel to Chinka-O. He keeps trying to impress her, and it never works.

### Ten sample lines
1. "Ladies and gentlemen, and Mister Bun: PIWI SQUIRMIN'S WORLD TOUR! Hold your applause. No, really. Hold it. I'll collect it later. *clack*"
2. "Every great show needs a leading lady, and Mrs. Chinka-O got the only applause my show has EVER had. With ONE pirouette. ...I'm not jealous. I'm CASTING."
3. "Scenery! A show needs scenery! *FWOOMP* ...There. One Palace of Fine Arts, pocket-sized."
4. "That's not a hand-hole in my back, Mister Bun. That's a ventilation feature."
5. "Nobody pulls my strings! ...Mostly because I cut them. With my teeth. Took a week. *clack*"
6. "Chinka-O, darling, smile for the second row!" / Chinka-O: "There is no second row." / "Smile for where it WILL be!"
7. "Who said that? ...Oh. Me. I said that. Nobody else is in here. *glances behind himself*"
8. "Is that... a WOODPECKER? Cancel the matinée!"
9. "You can't stop the show, Mister Bun. The show stops ME. ...Wait, that came out wrong."
10. (defeated) "Was it... was it at least a good show? Two stars? I'd take two stars."

---

## 2. Chinka-O (Brady-O's wife)

### Look (`src/05c_chinka.js`): Brady's spec, 16 Nov 2026
Brady's words: *"make chinka-o dressed like a ballerina in a pink tutu. shes latina so black hair and ecuadorian looking."* This replaces the earlier spec (brown tee, black leggings, sunglasses) entirely.

She is drawn as a flattering cartoon of a real, loved person, with no stereotype props and no costume clichés: the ballet is her whole costume.

| Part | Design |
|---|---|
| **Skin and face** | Warm brown skin (`#b67a52`, shaded `#93603c`, lit `#d29a6e`). Big dark-brown eyes with a bold lash flick, warm cheeks and a bright smile. |
| **Hair** | Long, wavy and black (with a cool highlight so it reads on dark levels), worn **down** with a pink bow. A ballet bun was the obvious choice, but on a phone a bun on top of her head reads like Brady-O's man bun. Long hair down gives her a silhouette nothing like his. |
| **Outfit** | A pink leotard with thin straps, a three-layer **pink tutu** standing out round her hips, pale pink tights, and pink satin **ballet slippers with crossed ribbons**. |
| **Dropped** | The sunglasses and the LED necklace. Her eyes carry her expressions now, and the tutu is the colour hit. |
| **Size and line** | About Brady-O's height. She is inked like him, with his cream rim, so the black hair reads at night. |

**Poses.** The ballet drives her animation:

| Pose | What it shows |
|---|---|
| `idle` | First position, arms softly rounded, the hair moving. |
| `walk` | A light dancer's walk, up on the balls of her feet. |
| `tiptoe` | **Sneaking out of the cage en pointe**: knee high, a finger to her lips, eyes sideways. |
| `pirouette` | Up on one pointe, the other foot at her knee, arms rounded overhead, the figure turning, with speed arcs. In a cutscene it becomes her **pirouette kick**, knocking a stagehand or a prop flying. |
| `unimpressed` | Arms folded, hip popped, one eyebrow up, lids lowered, the front toe tapping. |
| `wave` | A wave. |
| `seated` | On the swing in Piwi's show cage, legs crossed, eating popcorn. |
| `reunion` | A grand leap: legs split front and back, arms flung up, hearts. |
| `hug` | Arms out round something big and furry, up on her toes, eyes shut, hearts: her reunion with Pupo (draw Pupo `happy` just in front of her). |

### Personality and voice
Unimpressed, dry, quick and kind.
- **Never in danger, always inconvenienced.** She treats the kidnapping like a bad flight delay.
- **Always one pirouette from escaping.** She tiptoes out of the cage in several lands: a rug, a bike, a surfboard, a noodle lasso.
- **She runs the chase.** She leaves Brady-O postcards (the collectible), clues and snacks.
- **She heckles Piwi's shows,** and keeps upstaging him: she is a far better dancer than he is, and the crowd always notices.
- **She is fond of Brady-O** and completely confident he is coming.

### Ten sample lines
1. "Brady! I'm fine. He's made of wood and he's scared of termites. Follow my postcards. Bring snacks."
2. "It's *Mrs.* Chinka-O."
3. (in the cage, eating popcorn) "Honestly? The seats are good."
4. "I swapped his tap shoes for flip-flops. You'll know when the number starts."
5. "Got two bridges away en pointe this time. He hooked me back by the tutu. Rude."
6. "Piwi, the audience is three goats and a pigeon." / Piwi: "A SOLD-OUT CROWD!"
7. "He wants me in the chorus line. I *am* the chorus line, Piwi. Look at me. Tutu."
8. "He asked me to rate the show. I said 'needs more Brady'."
9. "KICK IT BACK, BRADY! He hates that!"
10. (reunion) "You followed every postcard?" / Brady-O: "Every single one. Your handwriting is beautiful."

---

## 2b. Pupo (Chinka-O's giant sloth, Brady-O's sidekick and steed)

### Who he is
Brady's words:
- *"she has a pet sloth named pupo that likes to touch peoples bellybuttons and he calls their bellybuttons their pupo and thats why hes called pupo"*
- *"brady-o is off to find chinka-o with pupo as his sidekick and steed. he can ride pupo"*

**Where he comes from.** Pupo is Chinka-O's pet, and Piwi left him behind: a giant sloth will not fit in a show cage. He sets off with Brady-O to get her back. Brady-O rides him, and finds him in the boxes. His arms stretch to hit bad guys, grab things across big gaps and climb. His super move is **PUPO POWER!**

**The gameplay is not in this file.** Riding, boxes, stretch arms, the Pupo levels and Pupo Power are all designed in **`docs/design/PUPO.md`** (written separately). This file covers only his character, look and story.

**Personality.** Slow, sweet and deadpan.

**The running gag.** He reaches out, very, very slowly, and pokes someone's belly button, which he calls a **"pupo"**. That is how he got his name. It is always gentle, with a tiny *boop*.

**His one mission is Piwi's pupo.** Piwi is a wooden dummy: **he has no belly button**. That baffles Pupo all the way round the world, and it drives Piwi mad ("I am SMOOTH. It's a DESIGN CHOICE.").

### Look (`src/05e_pupo.js`)
- **Build:** a chunky, huggable **giant** sloth, big enough to carry Brady-O. Sitting up, he is Brady-O's height. On all fours, his back is at Brady-O's hip, and Brady-O sits on it in his `ride` pose.
- **Fur:** shaggy tan with a lighter back stripe, a pale belly and his own little pupo.
- **Face:** a cream face mask with the dark stripes that run back from a sloth's eyes (the built-in smile), slow-blinking black eyes, a button nose and rosy cheeks.
- **Arms:** long, with three cream claws on each hand.
- **Arms at any length.** `Pupo.arm(ctx, x0, y0, x1, y1, { point })` draws one arm as a furry tube of any length, with tufts along its top, a ring every 9 units (so a long stretch reads as *stretched*, not as a pole) and a hand on the end, pointing finger optional. The stretch mechanics and PUPO POWER! are built on it.

**Poses:**

| Pose | What it shows |
|---|---|
| `idle` | Sitting up, blinking slowly. |
| `walk` | On all fours: a slow, rolling walk, the long front arms knuckling along on their claws. |
| `ride` | The same walk with Brady-O on his back. The pose's `rider` callback draws him at `Pupo.saddle(t)`, in Brady's own `ride` pose. |
| `poke` | The slow reach and poke: 2.6 s out, the pointing finger, a *boop* ring, a contented hold, back. |
| `stretch` | One arm out to **any** length (`reach`) at any angle (`angle`), finger pointing. |
| `happy` | Arms up, eyes shut, a big smile, hearts. |
| `sad` | Left behind: slumped, head down, a tear, hugging Chinka-O's pink hair bow. |
| `power` | **A PUPO POWER! key pose for cutscenes:** a ring of ten arms with every finger out; flat, hard-edged rainbow spiral eyes; a long patterned **carpet tongue** unrolling with a fringe; butterflies bursting from his belly button. The "PUPO POWER!" lettering is screen UI (big bold yellow, inked), drawn on the contact sheet but not part of his art. Animating it is for the `PUPO.md` work. |

### Sample lines
He speaks rarely, in slow, short lines, with long pauses written as "...". He means well every time.
1. "...pupo." (the poke)
2. "...hello... I am... Pupo... may I see... your pupo."
3. (to Piwi, after a very long reach) "...where... is... your pupo."
4. Piwi: "I don't HAVE one! I'm SMOOTH!" / Pupo: "...oh no."
5. (to the tortoise) "...your pupo... is... inside... your house."
6. (Brady-O climbing on) "...hold on... we go... fast now." (they do not)
7. (stretching across a gap) "...I can... reach. ...I have... always... been able... to reach."
8. "...is it... nap... or... adventure."
9. (the reunion, to Chinka-O) "...Chinka... your pupo. ...I missed it."
10. (the encore, to Piwi) "...I made you... a pupo." (he has drawn one on Piwi's tummy in Chinka-O's lip pencil)

---

## 3. The story

### 3.1 How the chase works: our own structure
- **The tour poster is the route.** Piwi's world tour has a printed poster of "TOUR DATES", which is the route through the lands. Every land is one **tour date**.
- **Brady-O never chases alone.** He rides Pupo, Chinka-O's giant sloth, who was left behind. Their double act carries every land: Brady-O in a hurry, Pupo in no hurry at all.
- **What Brady-O finds in each land.** Piwi's flying Showtrunk is parked above that land's venue. He has shrunk one landmark into **scenery** for his stage set (this keeps the existing landmark jars on the map and the Nepal fight). He has hired or bullied the land's boss into being **tonight's act**.
- **Chinka-O is never "in the boss's castle".** She is in the show cage under the Showtrunk, heckling. She leaves Brady-O her postcards (the collectible), and sometimes a snack or a clue.
- **What happens when the act falls.**
  - The show flops.
  - The scenery pops back to full size: the jar on the map shatters, as now.
  - Piwi stuffs everything into the trunk and flies off in a huff to the next tour date. Chinka-O waves from the cage, and Pupo waves back, about a minute later.
- **Nobody ever says "she's in another castle".** Instead, every land ends with Brady-O arriving a moment too late at a stage that is already being packed up, with a postcard from Chinka-O pinned to it.
- **The Nepal date is the Grand Finale.** Piwi performs it himself, and it is the main reunion.
- **World 22 is the secret encore,** where Piwi makes his last stand (§3.4).

### 3.2 The opening (intro panels, Mexico City)
1. **The trip.** Brady-O and Chinka-O (and Pupo, their giant sloth, asleep in the back row) finally booked it: the trip of a lifetime, with twelve countries, two passports and one very small plane.
2. **The show.** In a plaza in Mexico City, a steamer trunk flies down on two brass rotors. Its lid flips open into a tiny stage, its marquee lights up with PIWI!, and a wooden dummy bows to an empty plaza: "OPENING NIGHT!"
3. **The dance.** Nobody watches except Chinka-O. When his big number flops (his head falls off), she can't help herself: she steps in and finishes it with a perfect pirouette. The plaza bursts into applause, the first his show has ever had. Piwi: "A STAR! Madam, you are my LEADING LADY!"
4. **The hook.** A long vaudeville hook swings out of the wings and scoops her (by the tutu) into the gilded show cage under the trunk. Piwi aims a stage spotlight at the Palace of Fine Arts. *FWOOMP*: it shrinks to a pocket-sized backdrop. "Every show needs scenery!" Pupo reaches, very slowly, for Piwi's tummy. Piwi: "Don't. There's nothing there." Pupo: "...oh no."
5. **Lift-off.** The trunk lifts off, and Chinka-O calls down from the cage: "Brady! I'm fine. He's made of wood and scared of termites. Look after Pupo. Follow my postcards, and bring snacks!"
6. **Left behind.** The plaza is empty. Pupo sits in the middle of it, hugging her pink hair bow (`sad`). Brady-O kneels: "We're getting her back, buddy." Pupo, after a very long pause: "...climb on."
7. **The chase.** Brady-O rides off on Pupo after the trunk, at a top speed of slightly faster than walking: "Twelve tour dates. Crash every show, put the scenery back, and bring Chinka-O home."

### 3.3 The fourteen lands: a beat each
Each beat covers Piwi's show there, how Chinka-O sinks it, how the existing boss fits, and what Pupo makes of it (he pokes the act's belly button, or looks for it). **All fourteen boss fights are unchanged.** The "act" title can show as a one-line banner when the boss wakes (§8, step B5).

| Land | Beat |
|---|---|
| **1 Mexico** · El Gran Piñatón | **Opening Night.** Piwi books a giant piñata as his **warm-up act** and stuffs the Palace of Fine Arts behind the stage as scenery. Chinka-O tells the plaza's street dogs the piñata is full of candy. The piñata falls, the candy rains, and the dogs give the only standing ovation of the tour. *Pupo* pokes the fallen piñata's tummy and gets a lollipop. "...good... pupo." |
| **2 Ecuador** · El Tortugón | **The Middle-of-the-World Balancing Act.** Piwi wants to balance on the equator line, on a stage that walks: a giant grumpy tortoise hired by the hour. Chinka-O (home ground!) teaches the tortoise to sit down mid-act whenever Piwi says "and... HOLD!" The Equator monument pops back. *Pupo* takes the whole land to reach the tortoise, and finds him a kindred spirit: "...your pupo... is inside... your house." |
| **3 Brazil** · O Tucanão | **The Samba Spectacular.** Sugarloaf Mountain is wedged onto a carnival float, and the giant toucan is Piwi's **flying usher**. Chinka-O swaps his tap shoes for flip-flops and steals the number with a samba-ballet solo, and the float follows *her*. The final football puts the usher in the goal net. *Pupo* stretches an arm to the top of the stadium to poke the toucan, and gets there just after it leaves. "...next... year." |
| **4 Mozambique** · O Eremita | **The Beach Revue.** The hermit crab is Piwi's **props master**, who keeps everything in his shells. Chinka-O convinces the crab that a props master is owed a tea break every ten minutes. The great baobab comes out of its flowerpot. *Pupo* finds the crab's pupo by checking every shell, one a day. |
| **5 Morocco** · Berrad the Magnificent (and the Brass Owl, 5-4) | **The Tea-Time Magic Hour.** Piwi hires the pompous brass teapot as his **magician** and rolls up the great kasbah like a rug as the "vanishing palace". The Brass Owl is his clockwork **stage-door guard**. Chinka-O rolls herself up in a rug too, and tiptoes as far as the airport before Piwi notices. *Pupo* pokes the teapot: "...hot... pupo." |
| **6 Spain** · Paellasaurus | **Cooking with Piwi.** A live cooking show, with the Silk Exchange shrunk as the kitchen backdrop. Chinka-O adds extra chilli when he isn't looking, and the paella pan grows legs and a temper. Piwi: "That is NOT in the recipe!" *Pupo* finds a single grain of rice in his own fur and keeps it as a pet. |
| **7 France** · Le Grand Soufflé | **Piwi's Mime Period.** He takes up mime because nobody can heckle a mime. Chinka-O heckles him in ballet, which is louder. The giant soufflé is the head pastry chef of his backstage buffet, and the iron tower was meant to be the backdrop. She has hidden his ladder. *Pupo* pokes the soufflé and it sighs and sinks a little. "...sorry." |
| **8 Amsterdam** · The Cheese King | **The Royal Command Performance.** The Cheese King bought every ticket, so he is Piwi's only paying fan. The old windmill is folded up on a canal cruise. Chinka-O borrows a bike and gets two bridges away, nearly to Brady-O, before Piwi hooks her back off a drawbridge. *Pupo* finds the King's pupo is a hole in the cheese, and is delighted. |
| **9 Bali** · Boss Kera | **The Sunset Luau.** The monkey king steals Piwi's script, his props and his bow tie, and Piwi performs anyway. Chinka-O trades the monkey her hair bow for the cage key and gets as far as the surf on a borrowed board, which is why the gecko offers Brady-O one. *Pupo* and the monkey hang from the same branch all afternoon, best friends, while Brady-O waits. |
| **10 Vietnam** · Ong Phin | **The Water-Puppet Dream.** Piwi longs to star in a water-puppet show, but he is wood, so he just bobs. The grumpy coffee filter is his **backstage caterer**, and the Hoi An bridge is squeezed into a snow globe. Chinka-O lassoes the cage key with a noodle lasso, nearly. Piwi leaves for Japan so jittery from coffee that his jaw won't stop clacking. *Pupo* has one sip and is still exactly as slow. |
| **11 Japan** · The Great Kappa | **The Most Polite Comedy Act in the World.** Piwi tries to out-bow his co-star, a kappa. Chinka-O tells Brady-O the kappa rule in a postcard ("bow, Brady, BOW"). The golden roof fish go back on the castle. *Pupo* bows to the kappa as well. The bow takes until Nepal. |
| **12 Nepal** · Piwi Squirmin' himself | **THE GRAND FINALE**, at Piwi's Playhouse on the roof of the world (§3.4). |
| **13 Antarctica** (secret) · Big Tusk (and the Snow-Plough Bot, 13-3) | **The Penguin Matinée.** A detour: Piwi has heard that the penguins dress for the theatre every night. Big Tusk is the colony's grumpy **critic**, and the Snow-Plough Bot is Piwi's rented crew for a car park that doesn't exist. Chinka-O teaches the penguins ballet, and they are excellent. *Pupo* tries to find a penguin's pupo under its tuxedo and is too polite to look. |
| **22 World 22** (secret) · The Other Brady | **The Encore** (§3.4): where Piwi makes his last stand. |

The secret levels with the old villain in their names keep their places and fights, renamed:
- **12-7, Piwi's Prop Depot:** the Tin Yak is a wind-up stage prop.
- **12-3:** the supply shed is Piwi's.
- **The Nepal goons** are Piwi's wind-up stagehands, including a Piwi bobble-head toy.

### 3.4 The Grand Finale (Nepal 12-5) and the encore (World 22)

**12-5 "Piwi's Playhouse".** The vault is now his playhouse:
- the vault's shrink-ray cameras become his **Shrink-Spots**, stage follow-spots that shrink
- the jar archive is his **prop shelf** of every shrunken landmark

The fight is kept exactly, phase for phase:
1. **Phase 1, the Showtrunk over the summit stage.** Chinka-O is in the cage under it, eating popcorn and shouting tips. Pupo stretches an arm up to poke the trunk's underside ("...no pupo... here... either"). Piwi throws the shrunken landmarks, and Brady-O kicks them back.
2. **Phase 2.** The trunk crashes and the cage door pops open. Chinka-O tiptoes out, floats down using her tutu like a parachute, and cheers from the ledge (`NpChinka`, as now). Piwi climbs into **THE SHOWSTOPPER**, a walking stage mech built from his props, his trunk and the windmill arm. Its spotlight beam replaces the "laser monocle".
3. **Phase 3.** On foot in the gales. He is light wood, so the wind zones really toss him about.

**The finish.** His Shrink-Spot slips and goes off in his own face. Every landmark pops back, and Piwi is **pocket-sized**, rattling in his own prop jar: "LET ME OUT! IT'S TINY IN HERE!" Chinka-O runs to Brady-O with a grand leap, then turns and throws her arms round Pupo (`hug`).

**The ending (`TourEndingScene`, five cards):**
1. "The Shrink-Spot sputters... *FWOOMP*. Piwi Squirmin' is now exactly pocket-sized, and rattling in his own prop jar."
2. "One by one, the landmarks pop back to full size all over the world. Somewhere, a volcano sighs with relief."
3. Chinka-O: "You followed every postcard?" Brady-O: "Every. Single. One. Your handwriting is beautiful."
4. Pupo reaches out, very slowly, and pokes Chinka-O's belly button. "...Chinka... your pupo. ...I missed it." Chinka-O, hugging him: "I missed you too, you big slowpoke."
5. "Sunrise over the Himalayas. Two passports full of stamps, one giant sleepy sloth carrying all three of them home, and one very small, very quiet dummy in Chinka-O's dance bag. Best. Trip. Ever."

**Post-credits sting.** The tiny jar is on a hotel shelf, and its lid is unscrewed. A trail of tiny footprints leads to a door with **22** on it: "Legend speaks of a World 22..."

**World 22: the Encore (Piwi's last stand).** World 22 is a dream land of clocks, mirrors and the Writer's Desk (a nod to Brady's novel *22*). Piwi has slipped into it, where he can be any size and rewrite his own show. He has also **carved himself a wooden understudy of Brady-O**.
- **The fight is unchanged:** the Other Brady mirrors Brady-O, and Brady-O walks him into the hazards.
- **When the mirror cracks,** Piwi is revealed behind it, with his hand in the understudy's back. For once the dummy is the ventriloquist. "...BYE, ME" is the understudy's last line, and Piwi was doing the voice.
- **The final face-off is a short scene, not a new fight.** Piwi has nothing left: no trunk, no scenery, no acts. He asks for the one thing he wanted all along, an audience. Brady-O, Chinka-O and Pupo sit down on folding chairs and watch his whole show, once. Chinka-O joins in for the finale, and it is genuinely good. He takes a bow.
- **Pupo's gift.** Pupo has drawn a belly button on Piwi's tummy in Chinka-O's lip pencil: "...I made you... a pupo." Piwi, moved: "It's... the nicest thing anyone's ever drawn on me."
- **Chinka-O's review:** "Two stars for the show. One for the bow." Piwi: "THREE STARS!"
- **Where he ends up:** a puppet theatre in the plaza in Mexico City, where it all started, with a sign: "MATINÉES DAILY. NO HOOKS. BALLET ON SUNDAYS."

**If Brady-O reaches World 22 before beating Nepal** (it opens with 22 postcards, so this can happen), the text changes:
- Piwi is only rehearsing his Grand Finale, and Chinka-O watches from the cage, unimpressed.
- After the mirror cracks, Piwi says: "Fine! See you at the FINALE, Mister Bun!" and flies off.
- The encore scene plays the first time 22-4 is cleared after the main ending (`Save.data.beatGame`).

### 3.5 How Piwi travels: the Showtrunk (`src/05d_showtrunk.js`)
**The trunk.** A battered **steamer trunk** in deep teal with brass corners, leather straps and a sticker from every stop. It flies on **two brass rotors** on masts.

**The lid.** It stands open as a **little stage**, with blue velvet curtains, a gold star lining, footlights, and a magenta **marquee** with chasing bulbs that says **PIWI!**

**The show cage.** Under the trunk, on a chain, hangs a gilded cage (a "STAR" plaque on its base). Chinka-O sits on its swing in her tutu with her popcorn.

**Where it replaces the Baron's airship:**

| Where | What it becomes |
|---|---|
| The title (`SBWT.blimp`) | The Showtrunk drifting past, with Chinka-O in the cage. (Brady-O on Pupo can chase it across the title as a later polish idea.) |
| The route map and the land maps (`TourPanelFx.airship`) | `Showtrunk.mini`, about 44 px: the trunk, two rotors, the marquee, a tiny Piwi and the cage with a dot of black hair and pink tutu. |
| The intro panels and the Nepal fight's phase 1 (`TourVillain.blimp`) | The full Showtrunk. |

**On Rule 1 (§4), it becomes a party trunk:** `Showtrunk.draw({ party: true })` changes the marquee to PARTY!.

---

## 4. The secrets design, re-themed (`SECRETS_WARPS_SWITCHES.md`)
**The mechanics stay identical:** the six buttons, their rules, their effects and their unlocks.

**The new reason.** Piwi wants the whole world to be **his perfect audience**, so he has posted **Piwi's House Rules** everywhere: nothing may upstage the star.
- **RULE 7: NO HATS ON ANIMALS.** Hats upstage him.
- **RULE 3: NO DANCING.** Only Piwi dances.
- **RULE 9: NO SHORTCUTS.** The audience must arrive the long way, past his posters.
- **RULE 12: NO RETURNS.** No refunds, either.
- **RULE 10: NO LATE FLIGHTS.** The show starts on time.
- **RULE 1: NO FUN.** Fun is for after the show, and the show never ends.

**Why they are Brady Buttons.** Each rule is enforced by one of Piwi's backstage cue buttons: a big DO NOT PRESS button that runs that rule's machinery. On her way round the world, **Chinka-O has found every one**. She doodled Brady-O's face on the dome in lipstick (man bun, square shades) and stuck on a note: "PRESS ME, B ♥". Slapping one cancels the rule, and a stamp slams **CANCELLED** across the rule card.

**The look.** The waist-high pedestal and brass bezel stay, and so do the side-slap, the stomp-does-nothing squeak and the instant save. The dome changes to Piwi's magenta with his gold "P" etched in it, under Chinka-O's doodle. The plaque reads `DO NOT PRESS — BY ORDER OF PIWI SQUIRMIN' — RULE 7`.

**B6's cloche note** reads "NOT YET. — PIWI", and underneath, in Chinka-O's writing: "nearly there ♥ C".

**Other renames in that document:**

| Old | New |
|---|---|
| the Baron's Rulebook (pause page) | **HOUSE RULES**: Piwi's clipboard, with CANCELLED stamps |
| REVOKED | CANCELLED (the system name stays **Brady Buttons**) |
| the Baron's customs office / Evidence Locker | **Piwi's Lost Props cage**, guarded by his wind-up tin stage-door dogs |
| the Baron's stagehand mice | Piwi's stagehand mice (a natural fit) |
| "HELD BY ORDER OF THE BARON — RULE 9" | "HELD BY ORDER OF PIWI — RULE 9" |
| the party blimp | the party trunk |
| the Sound Limiter | Piwi's noise-complaint robot: he hates any music but his own |
| the Rulebook bonus level | **22-6 The House Rules**: inside Piwi's clipboard |
| the ending extra | Piwi at a party, sulking, then dancing badly with a clack on every beat |

**Code identifiers stay neutral, as already decided:** `button`, `rule`, `warp`, `TourRules`.

---

## 5. Names and words
- **In story text, credits and the characters' lines,** use **Brady-O** and **Chinka-O**. Postcards keep their warm short forms ("Brady!", "♥ C"); a postcard is personal.
- **The villain:** **Piwi Squirmin'**. His name and the act banners are in capitals in speech bubbles, like the other bosses.
- **His world tour:** "Piwi Squirmin's World Tour".
- **What he travels in and keeps:** the Showtrunk, the show cage, the Shrink-Spot, the prop jars.
- **The sloth:** **Pupo**. A belly button is a **pupo** (lower case) in his lines and in the story text.
- **Keep the code ids** (`np_baron`, `BARON_HP`, `baronSize`, `TourVillain`, `TourPanelFx.airship`, `this.blimp`, theme keys `np_fortress` and `np_depot`). Renaming them means touching saves, tests and atlases for no gain. Change their comments, not their names.

---

## 6. What is in this branch
| File | What |
|---|---|
| `src/05b_piwi.js` | `PIWI` (palette), `piwiPose`, `Piwi.draw` (6 poses), `Piwi.head`, `Piwi.badge` |
| `src/05c_chinka.js` | `CHINKA_O` (palette), `chinkaOPose`, `ChinkaO.draw` (9 poses), `ChinkaO.head` |
| `src/05d_showtrunk.js` | `Showtrunk.draw`, `.cage` (Chinka-O on the swing), `.mini`, `.rotor` |
| `src/05e_pupo.js` | `PUPO` (palette), `Pupo.draw` (8 poses incl. riding and the PUPO POWER! key pose), `Pupo.arm` (any length), `Pupo.hand`, `Pupo.head`, `Pupo.saddle`, `Pupo.carpet`, `Pupo.butterfly`; the preview hook `window.BRADY_STORY` (it is in the last file so every name exists when it runs) |
| `tools/story_preview/sheet.js` | Contact sheets on a mid-tone and a dark backdrop, plus a phone-screen crop, all through the game's own Ink |

All four load in every Super Brady-O World build. They only define names, so the game is unchanged.

**Size on a phone.** In the game these characters are 1.5 CSS px per art unit, on a 390-px-high screen at Near zoom. At that size Piwi is about 82 px tall, Chinka-O about 95 px (her tutu about 50 px wide) and Pupo about 95 px sitting up (about 75 px at the back on all fours, 125 px with Brady-O riding), next to Brady-O's 95 px.

---

## 7. The complete replacement table
**How to use it:**
- **Line numbers** are on `origin/main` `ab95358`. Other branches will move them, so **search for the quoted text**.
- **Text** means replace the string exactly. **Art** means a drawing change, described in words.
- **Comment** means change only the comment. It does not affect the game, but do it so nobody is misled.
- Strings marked `…` are quoted from their start. The rest of the line is unchanged unless shown.
- The apostrophe in "Squirmin'" must be escaped (`\'`) inside single-quoted JS strings.

**Not story text (leave alone):**
- the word "shrink" in `11_player.js`, `12_play.js`, `13_ui.js:71`, `06a_ink.js`, `28_tour_hb_systems.js`, `28_tour_i_behave.js` and the axolotl regrower (`29_tour_mx.js:532`, `29_tour_mx_levels.js:726`)
- "goon" inside "lagoon" (`29_tour_br*.js`, `29_tour_vn_levels.js:333`, `28_tour_ff_owscenes.js:462`, `28_tour_fc_maplayouts.js:83`)
- the rope ladder in Ecuador's treehouse (`29_tour_ec_levels.js:347, 356`)
- the **Snow Globe** power-up (`28_tour_dg_gear.js:325`, `29_tour_id*.js` hint): it is just a snow globe
- the `buzzkill` sound

**Another game:** `src/42_burns_world3.js` and `src/42_burns_world5.js` mention a baron. They belong to Burning Man, so leave them.

### 7.1 `src/28_tour_g_story.js` (the story file): text, art and scenes
| Line | Current | New |
|---|---|---|
| 1–10 | header comment: "BARON BRIC-A-BRAC, a greedy souvenir collector with a shrink-ray camera, snaps the Palace … Chinka leaps onto his rope ladder …" | Comment: "PIWI SQUIRMIN', a lonely ventriloquist dummy with a flying Showtrunk, hooks Chinka-O into his show cage in Mexico City and takes her on his world tour. Each land is a tour date: its boss is tonight's act and a landmark is shrunk into scenery. Brady-O chases him by Chinka-O's postcards. The Grand Finale is in Nepal; the encore in World 22. Design: docs/design/STORY_PIWI.md." |
| 11–62 | `const TourVillain = { draw(...) {…Baron…}, blimp(...) {…snow-globe blimp…} }` | **Art (S): keep the name `TourVillain` as an adapter, so `29_tour_np.js` keeps working.** `draw(ctx, x, y, s, t, pose)` → `Piwi.draw(ctx, { x, y, scale: s, t, pose: { flash: 'gloat', camera: 'talk', empty: 'idle' }[pose] \|\| 'idle', facing: 1 })`. For `pose === 'flash'`, also draw the old white radial flash in front of him (it is the Shrink-Spot going off). `blimp(ctx, x, y, s, t)` → `Showtrunk.draw(ctx, { x, y: y + 20 * s, scale: s * 0.8, t, piwi: null, chinka: true })`. |
| 149 | `'Brady and Chinka finally booked it: the trip of a lifetime. Twelve countries, two passports and one very small plane.'` | `'Brady-O, Chinka-O and Pupo, their giant sloth, finally booked it: the trip of a lifetime. Twelve countries, two passports and one very small plane (Pupo took up the back row).'` **Scene:** `ChinkaO.draw({ pose: 'wave' })` in place of `drawChinka(… 'cheer')`, `Pupo.draw({ pose: 'idle' })` behind them. |
| 151 | `'First stop: Mexico City. Then a giant snow globe floated over the plaza... and a tiny man with a big camera leaned out. "MAGNIFICENT! I\'LL TAKE IT!"'` | `'First stop: Mexico City. A steamer trunk flew down on two little rotors, its lid flipped open into a stage, and a wooden dummy bowed to an empty plaza. "OPENING NIGHT!"'`. **Scene:** Showtrunk landed at W*0.66 with `piwi: 'talk'`, `chinka: false`; Chinka-O `idle` beside Brady-O. |
| 153 | `'FLASH! The Palace of Fine Arts shrank down to snow-globe size. Baron Bric-a-Brac popped it in his pocket. "The finest souvenir collection on Earth needs the finest landmarks!"'` | **Becomes two panels.** (a) `'His head fell off mid-song. Chinka-O couldn\'t help it: she stepped in and finished his number with a perfect pirouette, and the plaza cheered. "A STAR! Madam, you are my LEADING LADY!"'` (Chinka-O `pirouette`; Piwi `startled` → `gloat`; Pupo `idle` at the side). (b) `'A long hook swung out of the wings and popped her, tutu and all, into his show cage. FWOOMP: his Shrink-Spot shrank the Palace of Fine Arts to pocket size. "Every show needs scenery!"'` (keep the white flash at pt 1.4–1.9; Chinka-O in `Showtrunk.cage`). |
| 155 | `'Chinka didn\'t wait. She grabbed the blimp\'s rope ladder as it lifted off. "Brady! I\'ll follow him. Watch for my postcards!"'` | `'Up went the trunk. Chinka-O leaned out of the cage: "Brady! I\'m fine. He\'s made of wood and scared of termites. Look after Pupo. Follow my postcards, and bring snacks!"'`. **New panel after it:** `'The plaza was empty, except for Pupo, hugging her pink hair bow. "We\'re getting her back, buddy." A very long pause. "...climb on."'` (Pupo `sad`, then Brady-O on Pupo `ride` heading off) |. **Scene:** Showtrunk rising (k as now), `chinka: true`, Brady-O `run`. |
| 157 | `'Every country he visits, he shrinks something else. Follow Chinka\'s postcards, beat the Baron\'s goons, put the world back to size and bring Chinka home.'` | `'Piwi Squirmin\'s World Tour: twelve tour dates. Follow Chinka-O\'s postcards, crash every show, put the scenery back and bring her home.'` **Scene:** Brady-O riding Pupo (`Pupo.draw({ pose: 'ride', rider })`) with the postcard. |
| 164 | `'Brady! The Baron\'s blimp landed in ' + C.name + '. Find his goon, save the landmark! ♥ C'` | `'Brady! Piwi\'s trunk landed in ' + C.name + '. Crash his show, save the landmark! ♥ C'` |
| 167 | comment `the ending (after the showdown in Nepal)` | `the ending (after the Grand Finale in Nepal)` |
| 172 | `'The Baron\'s Shrink-o-Matic sputters... FLASH. Baron Bric-a-Brac is now exactly snow-globe sized.'` | `'The Shrink-Spot sputters... FWOOMP. Piwi Squirmin\' is now exactly pocket-sized, and rattling in his own prop jar.'` |
| 174 | `'Chinka: "You followed every postcard?"  Brady: "Every. Single. One. Your handwriting is beautiful."'` | `'Chinka-O: "You followed every postcard?"  Brady-O: "Every. Single. One. Your handwriting is beautiful."'` |
| 174–175 (new card between) | – | Insert `'Pupo reached out, very slowly, and poked Chinka-O\'s belly button. "...Chinka... your pupo. ...I missed it."  "I missed you too, you big slowpoke."'` (Chinka-O `hug` in front of Pupo `happy`, then Pupo `poke`). The `stage >= 3` checks in `update`/`draw` move to `>= 4`. |
| 175 | `'Sunrise over the Himalayas. Two passports full of stamps. Best. Trip. Ever.'` | `'Sunrise over the Himalayas. Two passports full of stamps, one giant sleepy sloth carrying them both home, and one very small, very quiet dummy in Chinka-O\'s dance bag. Best. Trip. Ever.'` |
| 202 | `drawChinka(ctx, { … pose: this.stage >= 3 ? 'cheer' : 'wave', facing: -1 })` | **Art:** `ChinkaO.draw(ctx, { x: …, y: gy, scale: s * 1.1, t: this.t, pose: this.stage >= 2 ? 'reunion' : 'wave', facing: -1 })`, and Pupo (`happy`, on the Pupo card `poke`) on her other side, so the three stand together |
| 203–208 | `// the Baron, now a souvenir himself` + the snow globe + `TourVillain.draw(..., 'empty')` | **Art:** "Piwi, pocket-sized in his prop jar": the jar art (glass dome on a wooden base, as now), `Piwi.draw(ctx, { x: 0, y: -6, scale: 0.42, t, pose: 'startled' })` inside, and the purple band in `PIWI.jacket` magenta. |
| 227 | `['Chinka is home. The world is back to size. The Baron is a snow globe.', 's']` | `['Chinka-O is home. The world is back to size. Piwi is pocket-sized.', 's']` (see 7.2, line 524) |
| 228 | `['Brady  ·  long hair, man bun, many passport stamps', 'v'], ['Chinka  ·  fearless, fast, excellent postcards', 'v']` | `['Brady-O  ·  man bun, square shades, many passport stamps', 'v'], ['Chinka-O  ·  prima ballerina, unimpressed, excellent postcards', 'v'], ['Pupo  ·  sloth; belly button enthusiast', 'v']` |
| 229 | `['Baron Bric-a-Brac  ·  collector of other people\'s landmarks', 'v']` | `['Piwi Squirmin\'  ·  a dummy with a dream (and a hook)', 'v']` |
| 231 | `['THE BARON\'S GOONS', 'k']` | `['TONIGHT\'S ACTS', 'k']` |
| 232 | `` `Times the Baron got you: ${…}` `` | `` `Times Piwi got you: ${…}` `` |
| 234 | `'Legend speaks of a World 22.'` | Keep. Add after it, only once the encore is seen: `['Piwi Squirmin\'s Puppet Theatre, Mexico City. Matinées daily. No hooks.', 's']` |

### 7.2 Title, UI and maps (code-drawn art and strings)
**`src/28_tour_gt_title.js`**

| Line | Current | New |
|---|---|---|
| 4–5 | comment `the Baron's blimp drifts past with a bottled landmark` | `Piwi's Showtrunk drifts past with Chinka-O and Pupo in its show cage` |
| 86–104 | `// the Baron's blimp with a bottled landmark …` `blimp(k) { return this.inked(170, 150, 85, 60, k, x => { … }) }` | **Art (S):** `blimp(k) { return this.inked(190, 230, 95, 120, k, x => Showtrunk.draw(x, { x: 0, y: 0, scale: 0.85, t: 0.3, piwi: 'idle', chinka: true }), { width: 1.5 }); }`. It is painted once, so the rotors are frozen mid-spin, which reads fine. Check the box in portrait and at 568x320 (`tools/title_icon/shots.js`). |
| 615 | comment `the Baron's blimp drifting with a bottled landmark` | `the Showtrunk drifting by with Chinka-O in the cage` |
| (title show) | Brady jogging on the globe | **Optional, with `docs/design/PUPO.md`:** Brady-O riding Pupo round the globe (`Pupo.draw({ pose: 'ride', rider })`), chasing the Showtrunk. Not needed for the story change. |
| 524 | `c.lines.filter(l => !/Chinka is home\|Baron is a snow globe/.test(l[0]))` | `c.lines.filter(l => !/Chinka-O is home\|Piwi is pocket-sized\|Puppet Theatre/.test(l[0]))`. **Must change together with 7.1, line 227**, or the title's credits spoil the ending. |

**`src/13_ui.js`**

| Line | Current | New |
|---|---|---|
| 702 | `'Baron Bric-a-Brac wins this round. Not the trip.'` | `'Piwi Squirmin\' wins this round. Not the trip.'` |

**`src/28_tour_fb_mapgraph.js`**

| Line | Current | New |
|---|---|---|
| 195–205 | `airship(ctx, x, y, t) { … purple blimp, 'B' … }` | **Art (S):** `airship(ctx, x, y, t) { Showtrunk.mini(ctx, x, y - 4, t, 0.85); }`. This one change updates the route map (`28_tour_f_map.js:584`) and every land map (`28_tour_ff_owscenes.js:106`). |

**`src/28_tour_f_map.js`**

| Line | Current | New |
|---|---|---|
| 3 | comment `the Baron's airship` | `Piwi's Showtrunk` |
| 101 | comment `the Baron's airship` | `Piwi's Showtrunk` |
| 521 | comment `the Baron's jars, the airship` | `Piwi's prop jars, the Showtrunk` |

**`src/28_tour_fd_overworld.js`**

| Line | Current | New |
|---|---|---|
| 352 | `'THE BARON BLOCKED THIS TRAIL: CLEAR ' + … + ' FIRST'` | `'PIWI BLOCKED THIS TRAIL: CLEAR ' + … + ' FIRST'` (keep the word BLOCKED: `tools/sbw_overworld_test.js:69` looks for it) |
| 552 | comment `the Baron's roadblock` | `Piwi's roadblock` |

**`src/28_tour_fe_owpaint.js`**

| Line | Current | New |
|---|---|---|
| 383 | comment `a flag (the Baron's until the boss falls)` | `a flag (Piwi's until the boss falls)` |
| 405 | flag fill `done ? C.colors.a : '#6a4a8a'` | **Art:** `done ? C.colors.a : PIWI.jacket` |
| 411 | comment `the Baron's roadblock … with his B sign` | `Piwi's roadblock … with his P sign` |
| 406–407 (fort flag) | `c.fillText('B', fx + 5, fy - 14 + f * 0.5)`, colour `'#e8d8ff'` | **Art:** `'P'`, colour `PIWI.tie` |
| 426 | barrier stripes `c.fillStyle = '#6a4a8a'` | **Art:** `PIWI.jacket` |
| 429–434 | `// the Baron's sign on a stick` … `'#6a4a8a'` disc … `fillText(port ? '✈' : 'B', …)` | **Art:** comment `Piwi's sign on a stick`; for a road sign, `Piwi.badge(c, 0, 0, 6.5)`; keep the ✈ disc for the port, recoloured `PIWI.jacket` |

**`src/28_tour_ff_owscenes.js`**

| Line | Current | New |
|---|---|---|
| 8 | comment `under the Baron's gloom` | `under Piwi's gloom` |
| 105 | comment `the Baron's blimp hangs over a boss fort` | `Piwi's Showtrunk hangs over the boss fort (tonight's venue)` |
| 762–764 | comment `the Baron's supply depot: crates stamped B`; code `c.fillStyle = '#6a4a8a'` … `fillText('B', …)` and tarp `'#6a4a8a'` | **Art:** comment `Piwi's prop depot: crates stamped P`; `PIWI.jacket` and `'P'` |

**`src/28_tour_fc_maplayouts.js`**

| Line | Current | New |
|---|---|---|
| 234 | comment `the Baron's fortress` | `Piwi's playhouse` |

**`src/10d_bosses.js`**

| Line | Current | New |
|---|---|---|
| 179 | `np_baron: [176, 497, 55, 72]` (the ink box of the Nepal boss's art) | **Keep the id.** Re-measure the box after the Showtrunk replaces the blimp (`node tools/boss_test.js np --shots`, look at the outline). |

### 7.3 Country files: arrivals, postcards, gimmicks, signs (text only)
**`src/29_tour_mx.js` (Mexico)**

| Line | Current | New |
|---|---|---|
| 1452 | `arrival: 'Brady! The Baron shrank the Palace of Fine Arts down to the size of a piñata. Follow the confetti! ♥ C'` | `arrival: 'Brady! A wooden twerp called Piwi Squirmin\' hooked me into his flying trunk. I\'m fine. He shrank the Palace of Fine Arts for scenery. Follow the confetti, bring churros! ♥ C'` |

**`src/29_tour_mx_levels.js`**

| Line | Current | New |
|---|---|---|
| 719 | `'The axolotls here keep shrinking and growing back. Like my patience with the Baron. ♥ C'` | `'The axolotls here keep shrinking and growing back. Like Piwi\'s ego. ♥ C'` |
| 791 | `'The Baron tried to bottle the volcano. It did not agree. ♥ C'` | `'Piwi tried to book the volcano as his opening act. It did not agree. ♥ C'` |

**`src/29_tour_ec.js` (Ecuador)**

| Line | Current | New |
|---|---|---|
| 829 | comment `The Baron's giant grumpy tortoise.` | `Piwi's "walking stage": a giant grumpy tortoise he hired by the hour.` |
| 1085 | `'Brady! The Baron wants the Equator monument, globe and all. I\'m riding along in his snack crate. ♥ C'` | `'Brady! My country! And Piwi wants the Equator monument as scenery for his balancing act. I\'m in his show cage, eating his snacks. Give Pupo a hug from me. Slowly. ♥ C'` |

**`src/29_tour_ec_levels.js`**

| Line | Current | New |
|---|---|---|
| 738 | `'The Equator monument is back where it belongs! The Baron flew to Brazil. Samba time! ♥ C'` | `'The Equator monument is back where it belongs! Piwi flew to Brazil. He says I\'m doing samba in his next show. I am not. ♥ C'` |
| 780 | `"The waterfall roars like the Baron's blimp engine. Louder, actually. ♥ C"` | `"The waterfall roars like Piwi's trunk rotors. Louder, actually. Nicer, too. ♥ C"` |

**`src/29_tour_br.js` (Brazil)**

| Line | Current | New |
|---|---|---|
| 621 | comment `The Baron's giant toucan rules the air` | `Piwi's flying usher, a giant toucan, rules the air` |
| 903 | `'Brady! The Baron is trying to fit Sugarloaf Mountain into a carnival float. Hurry! ♥ C'` | `'Brady! Piwi is squeezing Sugarloaf Mountain onto a carnival float for his Samba Spectacular. I swapped his tap shoes for flip-flops. ♥ C'` |

**`src/29_tour_br_levels.js`**

| Line | Current | New |
|---|---|---|
| 1264 | `'Sugarloaf is back by the bay, full size! The Baron sailed for Africa. Next stop: Mozambique! ♥ C'` | `'Sugarloaf is back by the bay, full size! Piwi flew for Africa. Next stop: Mozambique! ♥ C'` |

**`src/29_tour_mz.js` (Mozambique)**

| Line | Current | New |
|---|---|---|
| 834 | `'Brady! The Baron shrank the biggest baobab in Africa and put it in a flowerpot. Rude! ♥ C'` | `'Brady! Piwi shrank the biggest baobab in Africa into a flowerpot "for the set". Rude! The crab he hired is ruder. ♥ C'` |

**`src/29_tour_mz_levels.js`**

| Line | Current | New |
|---|---|---|
| 817 | `'Something stampeded. Possibly wildebeest. Possibly the Baron\'s luggage. I ran. ♥ C'` | `'Something stampeded. Possibly wildebeest. Possibly Piwi, running from a termite. ♥ C'` |
| 921 | `'The great baobab is back on its hill! The Baron flew north, to Morocco. ♥ C'` | `'The great baobab is back on its hill! Piwi flew north, to Morocco. He packed six bow ties. ♥ C'` |

**`src/29_tour_ma.js` (Morocco)**

| Line | Current | New |
|---|---|---|
| 1100 | comment `THE BRASS OWL (the Baron's clockwork sentry)` | `THE BRASS OWL (Piwi's clockwork stage-door guard)` |
| 1627 | `'Brady! The Baron rolled up a whole kasbah like a rug and hid it in the souk. ♥ C'` | `'Brady! Piwi rolled up a whole kasbah like a rug for his magic act. I rolled myself up in a rug too. Nearly got out! ♥ C'` |

**`src/29_tour_ma_levels.js`**

| Line | Current | New |
|---|---|---|
| 445 | `gimmick: '… then the Baron\'s clockwork owl'` | `gimmick: '… then Piwi\'s clockwork owl'` |
| 473 | `'The kasbah is unrolled and back on its hill! The Baron went to Spain. ¡Olé! ♥ C'` | `'The kasbah is unrolled and back on its hill! Piwi went to Spain. ¡Olé! ♥ C'` |

**`src/29_tour_es.js` (Spain)**

| Line | Current | New |
|---|---|---|
| 1247 | `'Brady! The Baron shrank the Silk Exchange and hid it in a paella pan. It smells AMAZING in there. ♥ C'` | `'Brady! Piwi shrank the Silk Exchange for his cooking show set. It smells AMAZING in there. I added extra chilli. ♥ C'` |

**`src/29_tour_es_levels.js`**

| Line | Current | New |
|---|---|---|
| 298 | `'The Silk Exchange is back! The Baron pedalled off to France. Allez! ♥ C'` | `'The Silk Exchange is back! Piwi flew off to France in a huff. Allez! ♥ C'` |

**`src/29_tour_fr.js` (France)**

| Line | Current | New |
|---|---|---|
| 645 | comment `one of the Baron's souvenir minions` | `one of Piwi's souvenir stagehands` |
| 1336 | `'Bonjour, Brady! The Baron wants the iron tower for his shelf. I hid his ladder. Find his soufflé chef! ♥ C'` | `'Bonjour, Brady! Piwi wants the iron tower as a backdrop. He has taken up mime so nobody can heckle him. I am heckling in interpretive dance. I also hid his ladder. ♥ C'` |

**`src/29_tour_fr_levels.js`**

| Line | Current | New |
|---|---|---|
| 916 | `'The iron tower is back to full size! The Baron flew north, muttering about tulips. ♥ C'` | `'The iron tower is back to full size! Piwi flew north, muttering about tulips. ♥ C'` |

**`src/29_tour_nl.js` (Amsterdam)**

| Line | Current | New |
|---|---|---|
| 743 | `'Brady! The Baron folded up a whole windmill and took it on a canal cruise. ♥ C'` | `'Brady! Piwi folded up a whole windmill and took it on a canal cruise. I borrowed a bike and got two bridges away! ♥ C'` |

**`src/29_tour_nl_levels.js`**

| Line | Current | New |
|---|---|---|
| 415 | `'The windmill is unfolded and turning again! The Baron fled to Bali. Bring sunscreen. ♥ C'` | `'The windmill is unfolded and turning again! Piwi fled to Bali. Bring sunscreen. ♥ C'` |

**`src/29_tour_id.js` (Bali)**

| Line | Current | New |
|---|---|---|
| 1982 | `'Selamat datang, Brady! The Baron shrank a whole hillside of rice terraces into a snow globe. A gecko here says …'` | `'Selamat datang, Brady! Piwi shrank a whole hillside of rice terraces into a snow globe. A gecko here says …'` (rest unchanged) |

**`src/29_tour_id_levels.js`**

| Line | Current | New |
|---|---|---|
| 609 | `'… The Baron\'s blimp went inland. Catch a wave and follow! ♥ C'` | `'… Piwi\'s trunk went inland. Catch a wave and follow! ♥ C'` |
| 646 | `'… One of them looks like the Baron\'s blimp... no, it\'s a fish. ♥ C'` | `'… One of them looks like Piwi\'s trunk... no, it\'s a fish. ♥ C'` |
| 754 | `'The rice terraces are back! The Baron flew north to Vietnam. I smell pho. ♥ C'` | `'The rice terraces are back! Piwi flew north to Vietnam. I smell pho. ♥ C'` |

**`src/29_tour_vn.js` (Vietnam)**

| Line | Current | New |
|---|---|---|
| 1414 | `'Xin chào, Brady! The Baron squeezed a whole bridge into a snow globe …'` | `'Xin chào, Brady! Piwi squeezed a whole bridge into a snow globe …'` (rest unchanged) |

**`src/29_tour_vn_levels.js`**

| Line | Current | New |
|---|---|---|
| 485 | `'Thousands of stone islands, and the Baron\'s blimp hiding behind every one. Swing, Brady, swing! ♥ C'` | `'Thousands of stone islands, and Piwi\'s trunk hiding behind every one. Swing, Brady, swing! ♥ C'` |
| 575 | `gimmick: 'The Baron\'s coffee works: …'` | `gimmick: 'Piwi\'s backstage coffee works: …'` |
| 577 | `'The bridge is back in Hoi An! The Baron flew off toward Japan. He left his coffee. ♥ C'` | `'The bridge is back in Hoi An! Piwi flew off toward Japan. He left his coffee. I drank it. ♥ C'` |

**`src/29_tour_jp.js` (Japan)**

| Line | Current | New |
|---|---|---|
| 1676 | `'Konnichiwa, Brady! The Baron pried the two golden fish off a castle roof and is taking them home on the bullet train. …'` | `'Konnichiwa, Brady! Piwi pried the two golden fish off a castle roof for his set and is taking them on the bullet train. …'` (rest unchanged) |
| 1709 | `'The golden fish are back on the castle roof! The Baron took off toward the Himalaya. This is it, Brady. ♥ C'` | `'The golden fish are back on the castle roof! Piwi took off toward the Himalaya for his GRAND FINALE. This is it, Brady. ♥ C'` (legacy level list) |

**`src/29_tour_jp_levels.js`**

| Line | Current | New |
|---|---|---|
| 985 | same text as `jp.js:1709` | same new text |

### 7.4 Nepal: the Grand Finale (text, art and one scene change)
**`src/29_tour_np_levels.js`**

| Line | Current | New |
|---|---|---|
| 4 | comment `the Tin Yak, Baron Bric-a-Brac` | `the Tin Yak, Piwi Squirmin'` |
| 153, 181, 203, 265, 373, 504, 549, 576, 602, 778, 831 | comments: "the Baron's souvenir jar / crate lift / supply shed / archive / coins / fortress / supply depot" | Comments: "Piwi's prop jar / crate lift / prop shed / prop archive / coins / playhouse / prop depot" |
| 431 | `'A jar of the Baron\'s! Run into it to kick it. Kicked things fly back hard...'` | `'One of Piwi\'s prop jars! Run into it to kick it. Kicked things fly back hard...'` |
| 721 | `hint: 'A sled track leads off the trail to a shed with the Baron\'s badge...'` | `hint: 'A sled track leads off the trail to a shed with Piwi\'s badge...'` |
| 753 | `'The ice up here groans like an old house. The Baron\'s fortress is right at the top. ♥ C'` | `'The ice up here groans like an old house. Piwi\'s playhouse is right at the top. ♥ C'` |
| 779 | `name: "Baron's Fortress"` | `name: "Piwi's Playhouse"` (`theme`, `boss: 'np_baron'` unchanged) |
| 780 | `gimmick: 'The Baron\'s vault: shrink-ray cameras, a jar to kick through a crate wall, the archive of stolen things; then Baron Bric-a-Brac on the summit, throwing the landmarks'` | `gimmick: 'Piwi\'s playhouse: Shrink-Spot follow-spots, a prop jar to kick through a crate wall, the archive of shrunken scenery; then Piwi Squirmin\'s Grand Finale on the summit, throwing the landmarks'` |
| 781 | `hint: 'Stay out of the camera beams! The Baron throws the stolen landmarks: kick them right back at him'` | `hint: 'Stay out of the spotlights! Piwi throws the shrunken landmarks: kick them right back at him'` |
| 782 | `'WE DID IT, BRADY! Every landmark is back to size and the Baron is a snow globe. Let\'s go home. ♥ C'` | `'WE DID IT, BRADY! Every landmark is back to size and Piwi is pocket-sized. Let\'s go home. ♥ C'` |
| 832 | `name: "Baron's Supply Depot"` | `name: "Piwi's Prop Depot"` |
| 833 | `gimmick: 'Crate conveyors, the Baron\'s crate lifts, …'` | `gimmick: 'Crate conveyors, Piwi\'s crate lifts, …'` |
| 835 | `'The Baron keeps ALL his stolen stuff in crates. Labelled. In alphabetical order. ♥ C'` | `'Piwi keeps ALL his props in crates. Labelled. In alphabetical order. Mostly under P. ♥ C'` |

**`src/29_tour_np.js`**

| Line | Current | New |
|---|---|---|
| 3, 9, 11 | header comment `Baron Bric-a-Brac` / `12-5 Baron's Fortress … the Baron on the summit` / `12-7 Baron's Supply Depot` | `Piwi Squirmin'` / `12-5 Piwi's Playhouse … Piwi's Grand Finale on the summit` / `12-7 Piwi's Prop Depot` |
| 95 | comment `the Baron's fortress: a purple vault … his monocle banners` | `Piwi's playhouse: a purple vault … his P banners` |
| 95–100 | `npVault` painter: banners `#4a1a8a` with a gold band | **Art (S):** banners in `PIWI.jacket` with `Piwi.badge(ctx, x + 35, 120, 14)` on each. This is the code fallback; for the atlas strip see 7.6. |
| 190 | `name: "Baron's Fortress"` | `name: "Piwi's Playhouse"` |
| 271 | comment `the Baron's goons: wind-up souvenir toys` | `Piwi's stagehands: wind-up souvenir toys` |
| 282–287, 301 | `bobbleArt`: a bobble-head of the Baron (top hat, monocle); `npBobble` | **Art (S):** a Piwi bobble-head. Keep the yellow base and the purple body (recoloured `PIWI.jacket`), then the head as `Piwi.head(ctx, 0, -14, 0.9, t, { jaw: m === 'hop' ? 2.5 : 0, eyes: m === 'stun' ? 'dizzy' : 'open', look: 1 })` on the wobble. Add `sprite: 'piwiBobble'` to its config: no such clip exists, so it draws the code art instead of the Baron-faced `bobble` clip in the `np` atlas (check that `TourSprite` falls back on a missing clip). |
| 475 | comment `a shrink-ray security camera` | `a Shrink-Spot: one of Piwi's stage follow-spots that shrinks whatever it lights` |
| 475–500 | the camera head art | **Art (S, optional):** redraw the camera body as a stage spotlight: a black barrel with a magenta hood and a yellow lens. The beam is unchanged. |
| 487–488 | `'SHRUNK!'`, `'TOO SMALL TO SHRINK!'` | Keep. |
| 535, 596, 597, 601 | comments `the Baron's crates` / `12-5: the Baron's fortress` / `shrink-ray cameras` / `the Baron's jar shelf` | `Piwi's crates` / `12-5: Piwi's playhouse` / `Shrink-Spots` / `Piwi's prop shelf` |
| 611–620 | block comment `the final boss: BARON BRIC-A-BRAC … snow-globe airship … bric-a-brac mech … Shrink-o-Matic … Chinka arrives` | `the final boss: PIWI SQUIRMIN' … the Showtrunk (Chinka-O in its cage) … THE SHOWSTOPPER, a stage mech of his props … his Shrink-Spot … Chinka-O runs to Brady-O` |
| 697, 711, 721, 740 | comments `the Baron` | `Piwi` |
| 766 | comment `Chinka: tied up in the gondola in phase 1, she bails out on a scrap of balloon …` | `Chinka-O: in the show cage under the Showtrunk in phase 1 (Pupo on the bars); when it crashes she tiptoes out of the cage and floats down on her tutu, cheers from the ledge, …` |
| 777 | `['KICK IT BACK, BRADY!', 'YOU\'VE GOT THIS!', 'THAT\'S MY BRADY!', 'HE HATES THAT!']` | `['KICK IT BACK, BRADY!', 'YOU\'VE GOT THIS!', 'THAT\'S MY BRADY!', 'HE HATES THAT!', 'TELL HIM IT\'S A WOODPECKER!', 'GO, PUPO!']` |
| 786 | `drawChinka(ctx, { …, pose: chute→'jump', run→'run', hug→'hug', else 'cheer' })` | **Art:** `ChinkaO.draw(ctx, { x: this.cx, y: this.y + this.h, scale: 0.9, t, pose: { chute: 'tiptoe', run: 'walk', hug: 'reunion' }[this.state] \|\| 'wave', facing: this.facing })` |
| 826 | `'NOOO! MY COLLECTION!'` | `'NOOO! MY SCENERY!'` |
| 829 | comment `the Shrink-o-Matic slips` | `the Shrink-Spot slips` |
| 833 | `'LET ME OUT! IT\'S TINY IN HERE!'` | Keep. |
| 855 | `ctx.fillText('BRIC-A-BRAC MK II', 0, -62)` on a `#7a2ac8` plate | `ctx.fillText('SHOWSTOPPER', 0, -62)` on a `PIWI.jacket` plate |
| 864–867 | comment `the cockpit dome with the Baron inside, his monocle hot …`; `TourVillain.draw(ctx, 0, -104, 0.42, t, 'empty')` | Comment `the cockpit dome with Piwi inside, his spotlight hot …`; `Piwi.draw(ctx, { x: 0, y: -104, scale: 0.42, t, pose: 'talk' })` |
| 874 | `name: 'Baron Bric-a-Brac'` | `name: 'Piwi Squirmin\''` (keep `id: 'np_baron'`, `BARON_HP`) |
| 878 | `'AH, THE LAST SOUVENIR: YOU!'` | `'AH, MISTER BUN! JUST IN TIME FOR THE FINALE!'` |
| 900 | `'MY AIRSHIP! ...TO THE MECH!'`, banner `'THE BRIC-A-BRAC MECH'` | `'MY TRUNK! ...TO THE SHOWSTOPPER!'`, banner `'THE SHOWSTOPPER'` |
| 906 | `'MY MECH! FINE. I\'LL DO IT MYSELF!'` | `'MY SHOWSTOPPER! FINE. SOLO ACT!'` |
| 922 | `['CATCH!', 'A SOUVENIR FOR YOU!', 'HEADS UP, SOUVENIR!']` | `['CATCH!', 'A PROP FOR YOU!', 'HEADS UP, MISTER BUN!']` |
| 927 | `'SNOW GLOBES! FREE OF CHARGE!'` | `'SNOW GLOBES! FREE WITH EVERY TICKET!'` |
| 945 | `'BEHOLD: BRIC-A-BRAC MK II!'` | `'BEHOLD: THE SHOWSTOPPER!'` |
| 954 | `['TAKE THIS ONE TOO!', 'FETCH, SOUVENIR!', 'MECH THROW!']` | `['TAKE THIS ONE TOO!', 'FETCH, MISTER BUN!', 'BIG FINISH!']` |
| 959 | `'MONOCLE... ENGAGE!'` | `'SPOTLIGHT... ON ME!'` |
| 964 | `'MECH STOMP!'` | `'TAP DANCE!'` |
| 989 | `['YOU\'LL NEVER GET THIS ONE!', 'IT\'S MINE! MINE!', 'CATCH ME IF YOU CAN!']` | `['YOU\'LL NEVER GET THIS ONE!', 'THE SHOW MUST GO ON!', 'CATCH ME IF YOU CAN!']` |
| 998 | `'SMILE FOR THE SHRINK-O-MATIC!'` | `'SMILE FOR THE SHRINK-SPOT!'` |
| 1011 | `['MY PAINTWORK!', 'THAT WAS NOT YOURS TO RETURN!', 'HOW RUDE!']` | `['MY LACQUER!', 'THAT WAS SCENERY!', 'HOW RUDE!']` |
| 1012 | `['MY BRIC! MY BRAC!', 'NOT THE WINDMILL ARM!', 'WARRANTY VOID!']` | `['MY PROPS!', 'NOT THE WINDMILL ARM!', 'BOO! I MEAN, OW!']` |
| 1013 | `['OW! MY MONOCLE!', 'UNHAND MY LANDMARK!']` | `['OW! MY HINGES!', 'UNHAND MY LANDMARK!']` |
| 1020–1025 | phase 1 draw: `TourVillain.blimp(ctx, 0, 0, 1, t)`; `drawChinka(... pose: 'captive')` in the gondola; `TourVillain.draw(ctx, 18, 54, 0.42, t, …)` | **Art (M):** `Showtrunk.draw(ctx, { x: 0, y: 30, scale: 0.75, t, piwi: P === 'drop' ? 'gloat' : P === 'wind' ? 'startled' : 'talk', chinka: b.act !== 'crash' })`. The trunk and lid fill the old 140x84 box; the cage hangs below it, outside the hitbox. Delete the separate `drawChinka` and `TourVillain.draw` lines: Chinka-O is in the cage and Piwi is on the stage. In the crash (line 1020) fade out `Showtrunk.draw(… chinka: false)` instead of the blimp. |
| 1031–1041 | phase 3: `// the little Baron on foot (and … his own snow globe)`; `TourVillain.draw(ctx, 0, 0, 1, t, …)` | Comment `Piwi on foot (and, at the end, pocket-sized in his own prop jar)`; `Piwi.draw(ctx, { x: 0, y: 0, scale: 1.15, t, pose: P === 'run' ? 'walk' : P === 'hurt' ? 'startled' : P === 'finale' ? 'defeated' : P === 'flash' \|\| P === 'aim' ? 'gloat' : 'talk' })`. Check the pose names against `b.pose` values in the brain when applying. |
| 1064, 1086 | comments `the Baron's supply depot` | `Piwi's prop depot` |
| 1088 | `name: "Baron's Supply Depot"` | `name: "Piwi's Prop Depot"` |
| 1148 | comment `stacks of the Baron's crates` | `stacks of Piwi's prop crates` |
| 1354 | `landmark: 'the snow globes of the whole world'` | `landmark: 'every landmark on Piwi\'s prop shelf'` |
| 1355 | `'Namaste, Brady! The Baron\'s fortress is up in the mountains, full of every landmark he stole. A yak has offered to carry you. I said yes for you. ♥ C'` | `'Namaste, Brady! Piwi\'s Grand Finale is up on the roof of the world, with every landmark he shrank as scenery. A yak has offered to carry you. I said yes for you. ♥ C'` |
| 1382 | same postcard as `np_levels.js:753` | same new text (legacy level list) |
| 1384–1388 | legacy `name: "Baron's Fortress"`, gimmick `The Baron's vault: shrink-ray security cameras … Baron Bric-a-Brac …`, hint, postcard | same as `np_levels.js:779–782` |

### 7.5 World 22 and Antarctica: small story additions
**`src/29_tour_w22.js`**

| Line | Current | New |
|---|---|---|
| 500–501 | finish: `'...BYE, ME.'`, `'SEE YOU AT 22:22.'` | **Scene (S–M):** keep both lines. After the wave, Piwi pops up from behind the cracked pane (`Piwi.draw`, pose `startled`, then `talk`) with a carved wooden Brady-O understudy limp on his arm. (a) Before the main ending (`!Save.data.beatGame`): `K.say(g, piwi, 'FINE! SEE YOU AT THE FINALE, MISTER BUN!')`, and he scuttles off. (b) After it: start `TourEncoreScene` when the level is cleared (§3.4: folding chairs, the show, a bow, "Two stars for the show. One for the bow." / "THREE STARS!", the puppet theatre sign). New scene class in the story file; about 4 cards. |
| 620 | `arrival: 'Brady... every clock here says 22:22. … I think we\'re dreaming. ♥ C'` | After the main ending, `'Brady... every clock here says 22:22. Piwi got out of his jar and ran in here. I can hear him rehearsing. Tell Pupo to bring his longest arm. ♥ C'`. Before it, keep the current text. |

**`src/29_tour_aq.js`**

| Line | Current | New |
|---|---|---|
| 572 | `arrival: 'Brady, you found it! A whole secret continent. The penguins say hi. …'` | Optional: append `' Piwi is here booking a matinée. They dress for the theatre, apparently.'` |

### 7.6 Pre-rendered art (Blender atlases): later, not blocking
| Atlas / file | What shows the old villain | Change |
|---|---|---|
| `np` atlas, clips `bobble_*` (`tools/blender/sprites/np_enemies.py` lines 2, 14–15, 102, 510–536) | a bobble-head of the Baron: top hat, monocle, moustache | **L (Blender):** re-model as a Piwi bobble-head: copper hair, jaw slots, magenta jacket. Until then the code art in 7.4 is used (`sprite: 'piwiBobble'`). |
| `np_fortress` atlas, strip L0 (`np_fortress.py` 1–3, 52) | purple banners with a gold **monocle** emblem | **M (Blender):** banners in Piwi magenta with a gold "P". The monocle reads as nothing to a player, so this can wait. |
| `np_depot` atlas (`np_depot.py` 1, 4) | "the Baron's banners" | Same as above. |
| `tools/blender/sprites/fr_enemies.py:13`, `jp_castle.py:4` | comments | Comment only. |
| `tools/blender/sprites/COUNTRIES.txt` 73, 184, 193, 202 | a generated listing of level text | Regenerate it after 7.3–7.4, or edit the four lines to match. |

### 7.7 Tests and tools
**`tools/gameplay_test.js`**

| Line | Current | New |
|---|---|---|
| 295 | comment `Baron Bric-a-Brac's three phases` | `Piwi Squirmin's three phases` |
| 310 | label `'Baron Bric-a-Brac fights in three phases; …'` | `'Piwi Squirmin\' fights in three phases; …'` |
| 391 | `/Baron Bric-a-Brac/.test(credits)` | `/Piwi Squirmin/.test(credits)` (**must change with 7.1**, or this check fails) |

**`tools/boss_tests/np.js`**

| Line | Current | New |
|---|---|---|
| 1, 13, 15, 17, 19, 25, 31, 42, 53, 59, 75 | labels and comments: "Baron", "airship", "bric-a-brac mech" | "Piwi", "Showtrunk", "Showstopper mech". The checks themselves are unchanged: phases, `r.h === 120`, `r.chinka`. |
| 46 | `snap('np_airship.png')` | `snap('np_showtrunk.png')` (optional) |

**`tools/sbw_overworld_test.js`**

| Line | Current | New |
|---|---|---|
| 57 | comment `behind the Baron's roadblock` | `behind Piwi's roadblock` |
| 69 | `/BLOCKED\|BARON/` | `/BLOCKED\|PIWI/` (passes either way) |

**`tools/sbw_toolkit_shots.js`**

| Line | Current | New |
|---|---|---|
| 356 | label `'… the Baron\'s jar over Mexico shatters and the airship moves on'` | `'… Piwi\'s prop jar over Mexico shatters and the Showtrunk moves on'` |

**`tools/build.js`**

| Line | Current | New |
|---|---|---|
| 37 | `desc: 'Brady flies around the world after Baron Bric-a-Brac, who bottles every landmark he can find: a 2D platformer across twelve countries.'` | `desc: 'Brady-O chases Piwi Squirmin\', a runaway ventriloquist dummy who has whisked his wife Chinka-O off on a world tour: a 2D platformer across twelve countries.'`. Touch only the world app's entry. This also changes the manifest and launcher text. |

### 7.8 Docs
| File | Line | Change |
|---|---|---|
| `README.md` | 45 | "Baron Bric-a-Brac is shrinking and stealing the world's landmarks, so Super Brady-O flies after him on a world map. … Chinka sends postcard clues." → "Piwi Squirmin', a lonely ventriloquist dummy, has hooked Brady-O's wife Chinka-O into the show cage of his flying Showtrunk and taken her on his world tour, so Brady-O chases him across a world map. … Chinka-O sends postcard clues (and sabotages every show)." |
| `docs/WORLD_TOUR_GUIDE.md` | 49 | "The villain (Baron Bric-a-Brac)" → "The villain (Piwi Squirmin'; his art is in `05b_piwi.js`, the Showtrunk in `05d_showtrunk.js`, Chinka-O in `05c_chinka.js`)" |
| `docs/WORLD_TOUR_GUIDE.md` | 88 | "what the Baron shrank (story flavour)" → "what Piwi shrank into scenery (story flavour)" |
| `docs/BOSS_REDESIGN.md` | 102 | "The Baron's clockwork sentry" → "Piwi's clockwork stage-door guard" |
| `docs/BOSS_REDESIGN.md` | 154–162 | Heading "Nepal 12-5: Baron Bric-a-Brac, the finale" → "Nepal 12-5: Piwi Squirmin', the Grand Finale". In the text, "the Baron" → "Piwi", "airship" → "Showtrunk (Chinka-O in its cage)", "bric-a-brac mech … laser monocle" → "the Showstopper mech … spotlight beam". Mechanic unchanged. |
| `docs/design/LEVEL_OVERHAUL.md` | 78 | "shrunk by the Baron" → "shrunk by Piwi's Shrink-Spot" |
| `docs/design/LEVEL_OVERHAUL.md` | 153 | "(the Baron's automaton)" → "(Piwi's automaton)" |
| `docs/design/LEVEL_OVERHAUL.md` | 233 | "a Baron supply shed" → "Piwi's prop shed" |
| `docs/design/LEVEL_OVERHAUL.md` | 235 | "12-5 Baron's Fortress … shrink-ray cameras" → "12-5 Piwi's Playhouse … Shrink-Spots" |
| `docs/design/LEVEL_OVERHAUL.md` | 237 | "12-7 Baron's Supply Depot … the Baron's crate lifts" → "12-7 Piwi's Prop Depot … Piwi's crate lifts" |
| `docs/design/LEVEL_OVERHAUL.md` | 587 | "the Baron's jar" → "Piwi's prop jar" |
| `docs/design/LEVEL_OVERHAUL.md` | 588 | "The Baron's airship" → "Piwi's Showtrunk" |
| `docs/design/LEVEL_OVERHAUL.md` | 893, 900 | "the Baron's shrink-ray tripwire", "Baron surveillance camera" → "Piwi's Shrink-Spot tripwire", "Piwi's spotlight camera" |
| `docs/design/SECRETS_WARPS_SWITCHES.md` | 1, 22, 114, 186, 277, 294–304, 318, 319, 322, 334, 346, 365, 376, 502, 691, 707 | Apply §4: "the Baron's Rulebook" → "Piwi's House Rules"; "Ban Buzzer" → "Brady Button" (already decided); "REVOKED" → "CANCELLED"; "the Baron's customs office" → "Piwi's Lost Props cage"; the dome look and plaque as in §4; "NOT YET. — THE BARON" → "NOT YET. — PIWI" plus Chinka-O's note; "the Baron's airship" → "Piwi's Showtrunk"; "party blimp" → "party trunk"; "22-6 The Rulebook" → "22-6 The House Rules"; "The Baron's noise-complaint robot" → "Piwi's noise-complaint robot". Then delete the "read Piwi" note at line 6. |
| `docs/design/TOOLKIT_STATUS.md` | 194, 200 | "the Baron's roadblock" → "Piwi's roadblock"; "the Baron's jars, airship" → "Piwi's prop jars, the Showtrunk" |
| `docs/handoff/SUPER_BRADY_O_WORLD.md` | 8 | "chasing Baron Bric-a-Brac" → "chasing Piwi Squirmin', who has taken Chinka-O on his world tour" |
| `docs/handoff/SBW_RELAY.md` | 48 | "the Baron's blimp" → "the Baron's blimp (since replaced by Piwi's Showtrunk, `docs/design/STORY_PIWI.md`)" |
| `docs/HANDOFF_LOCAL_AGENTS.md` | 19 | "the villain Baron Bric-a-Brac" → "the villain Piwi Squirmin'" |
| `docs/handoff/README.md` | 69 (§4, the Chinka bullet) | Replace "**Chinka: CONFLICT, ask Brady.** The original spec … Show Brady both and let him choose before more Chinka work." with "**Chinka (Super Brady-O World, decided by Brady 16 Nov 2026): Chinka-O, a ballerina in a pink tutu** (pink leotard, layered tutu, pale pink tights, satin slippers with ribbons). She is Ecuadorian: warm brown skin, dark eyes, long wavy black hair worn down with a pink bow. No sunglasses. Her giant pet sloth **Pupo** is Brady-O's sidekick and steed in the story. Code-drawn in `src/05c_chinka.js` and `src/05e_pupo.js`; story in `docs/design/STORY_PIWI.md`. The 3D Burning Man and Art Cart Chinka is a separate question for those games' owners." In the Brady bullet, "stubble" → "no stubble" (the current rule). |
| `docs/handoff/SUPER_BRADY_O_WORLD.md` | (the cast note, wherever Chinka's look is described) | Point to the README §4 rule above. |

### 7.9 Count of replacements by file
| File | Text | Art / scene | Comment only |
|---|---|---|---|
| `src/28_tour_g_story.js` | 15 | 5 (TourVillain adapter, 2 new intro panels, ending art, Chinka-O and Pupo in the ending, the new Pupo card) | 2 |
| `src/28_tour_gt_title.js` | 1 (credits filter) | 1 (Showtrunk) | 2 |
| `src/13_ui.js` | 1 | – | – |
| `src/28_tour_fb_mapgraph.js` | – | 1 (map icon) | – |
| `src/28_tour_f_map.js` | – | – | 3 |
| `src/28_tour_fd_overworld.js` | 1 | – | 1 |
| `src/28_tour_fe_owpaint.js` | – | 3 (flag, barrier, sign) | 2 |
| `src/28_tour_ff_owscenes.js` | – | 1 (depot crates) | 2 |
| `src/28_tour_fc_maplayouts.js` | – | – | 1 |
| `src/10d_bosses.js` | – | 1 (re-measure the ink box) | – |
| Mexico (`mx`, `mx_levels`) | 3 | – | – |
| Ecuador (`ec`, `ec_levels`) | 3 | – | 1 |
| Brazil (`br`, `br_levels`) | 2 | – | 1 |
| Mozambique (`mz`, `mz_levels`) | 3 | – | – |
| Morocco (`ma`, `ma_levels`) | 3 | – | 1 |
| Spain (`es`, `es_levels`) | 2 | – | – |
| France (`fr`, `fr_levels`) | 2 | – | 1 |
| Amsterdam (`nl`, `nl_levels`) | 2 | – | – |
| Bali (`id`, `id_levels`) | 4 | – | – |
| Vietnam (`vn`, `vn_levels`) | 4 | – | – |
| Japan (`jp`, `jp_levels`) | 3 | – | – |
| `src/29_tour_np_levels.js` | 9 | – | 12 |
| `src/29_tour_np.js` | 26 | 7 (vault banners, bobble, spotlight, Chinka-O entity, mech plate and cockpit, phase 1 Showtrunk, phase 3 Piwi) | 20 |
| `src/29_tour_w22.js`, `src/29_tour_aq.js` | 2 | 1 (encore scene) | – |
| Blender sources and atlases | – | 3 atlases (later) | 3 |
| Tests and tools (`gameplay_test`, `boss_tests/np`, `sbw_overworld_test`, `sbw_toolkit_shots`, `build.js`) | 6 | – | 14 |
| Docs (9 files) | about 40 lines | – | – |
| **Total** | **about 97 strings in the game, plus about 42 doc lines** | **24 art/scene changes (3 of them Blender, later)** | **about 70 comments** |

---

## 8. Implementation plan (phase B), in order
Do this after the title, maps, level, post-FX, player/UI and validator branches have merged, on a fresh branch from `main`. Each step is one small commit.

| Step | What | Kind | Size |
|---|---|---|---|
| **B1** | All text in 7.3 and 7.4 (arrivals, postcards, gimmicks, hints, signs, level names, Piwi's and Chinka-O's fight lines), `13_ui.js:702`, `fd_overworld.js:352`, `build.js:37`. | Text only | **S** (2–3 h) |
| **B2** | Credits and ending text in 7.1, **together with** the title filter (7.2, line 524) and the test regex (7.7, `gameplay_test.js:391`). | Text only, coupled | **S** (1 h) |
| **B3** | The map: `TourPanelFx.airship` → `Showtrunk.mini`; flags, signs and depot crates to Piwi's P and magenta (7.2). | Code art, using the new files | **S** (2 h) |
| **B4** | The title: `SBWT.blimp` → the inked Showtrunk; check portrait and 568x320 with `tools/title_icon`. | Code art | **S** (1–2 h) |
| **B5** | The `TourVillain` adapter (7.1, lines 11–62). After it, old callers already draw Piwi and the trunk. Optionally add the "tonight's act" banner on boss wake: one data table `{ mx_pinata: 'THE WARM-UP ACT', ec_tortoise: 'THE WALKING STAGE', br_toucan: 'THE FLYING USHER', mz_hermit: 'THE PROPS MASTER', ma_berrad: 'THE MAGICIAN', es_paella: 'COOKING WITH PIWI', fr_souffle: 'THE PASTRY CHEF', nl_cheese: 'THE ONLY PAYING FAN', id_kera: 'THE SCRIPT THIEF', vn_phin: 'THE CATERER', jp_kappa: 'THE CO-STAR', aq_walrus: 'THE CRITIC' }` and one line in the Boss wake path. | Code; the banner is a small engine hook | **S** (2 h) |
| **B6** | The intro panels: 6 panels, two of them new (7.1, lines 149–157), using Piwi, Chinka-O (pirouette, unimpressed, wave), Pupo (idle, sad, and riding with Brady-O) and the Showtrunk (Chinka-O in the cage). Every SBW use of the old `drawChinka` (story file, `29_tour_np.js`) becomes `ChinkaO.draw`; `22_cast.js` itself stays for any other caller. | New scenes (code art) | **M** (½ day) |
| **B7** | The ending art: Chinka-O's reunion leap, her hug with Pupo and Pupo's belly-button card, Piwi pocket-sized in his jar (7.1, lines 174–208). Optionally add the post-credits sting card. | New scene art | **S–M** (2–4 h) |
| **B8** | The Nepal Grand Finale re-skin (7.4 art rows): phase 1 Showtrunk with Chinka-O in the cage; the `NpChinka` popcorn parachute → `ChinkaO`; Showstopper plate and cockpit; phase 3 Piwi poses; Piwi bobble code art; vault banners; spotlight heads. Then re-measure the ink box (`10d_bosses.js:179`) and run `boss_test np --shots`. | Code art, no fight logic | **M** (1 day) |
| **B9** | The World 22 encore: Piwi's reveal after the Other Brady, the two variants, and the `TourEncoreScene` (7.5). | New scene | **M** (½–1 day) |
| **B5b** | Pupo's verdict line after each boss falls: one `K.say` per land from a data table next to the act table (§3.3 has the lines; e.g. Mexico `'...good... pupo.'`, Ecuador `'...your pupo... is inside... your house.'`). Everything else Pupo does in play (riding, boxes, stretch arms, PUPO POWER!) is built from `docs/design/PUPO.md` on `Pupo.draw` / `Pupo.arm`. | Text plus a tiny hook | **S** (1 h) |
| **B10** | Tests, tool labels and docs (7.7, 7.8), including the SECRETS doc re-theme (§4). | Text only | **S** (2 h) |
| **B11** | Blender re-renders: `np` bobble clips, `np_fortress` and `np_depot` banners (7.6). | New pre-rendered art | **L**, later, one private Blender GUI job |

**Total without B11:** about 3–4 agent-days. B1, B2 and B10 are text only. B3–B5 and B7 are small code-art swaps that use the new files. B6, B8 and B9 are new scenes.

**Tests after phase B:**
- the full SBW suite in `docs/handoff/SBW_RESUME.md`, especially:
  - `gameplay_test` (finale and credits checks)
  - `boss_test np` (all phases; Chinka-O spawns in phase 2)
  - `sbw_overworld_test` (the roadblock toast)
  - `sbw_toolkit_shots --checks` (the world-map jar and Showtrunk)
- `apps_test` for all three apps
- look at the title, map, intro, Nepal and ending screenshots yourself

**No save reset is needed:** no level changes. The `beatGame` flag still drives the credits filter.

---

## 9. Open questions for Brady (each answerable in one sentence)
1. **Where should Brady-O get Chinka-O back?** Default: **in Nepal**, at the Grand Finale, so every player sees the reunion. Piwi's real last stand is then the World 22 encore, where he finally gets an audience, a three-star review and a puppet theatre job.
2. **Should the game say "Brady-O" and "Chinka-O" everywhere, or only in the story?** Default: in story scenes, credits and Piwi's lines. Her postcards keep saying "Brady!"
3. **Is Piwi's look right?** He is a wooden dummy with copper painted hair, a jaw that clacks, a too-small magenta pinstripe jacket, a lemon polka-dot bow tie and teal trousers, a wink at the type without copying anyone. Default: yes, as on the contact sheet.

(Chinka-O's outfit stays the original spec until Brady chooses; the colours are one table in `src/05c_chinka.js`.)
