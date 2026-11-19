/* ============================================================
   Wormholes across the tour (SECRETS_WARPS_SWITCHES.md §3.5, the rollout): a Loading Dock past the gate of one
   level in most lands, each with a Wormhole (TourBackstage.addDock in 28_tour_sa_backstage.js). The dock is added
   after the level's last step, so nothing earlier in the level moves. Mexico's (the Rigging in 1-4) and Festival
   Fields' are in their own files. Where each is and where it leads: docs/design/BACKSTAGE_STATUS.md.
   How to find one: a stack of flight cases before the level's gate and a yellow CREW ONLY sign on the truss over it.
   Climb the cases, cross the truss over the gate without touching it, drop down and walk on off the right edge.
   ============================================================ */
(function () {
if (typeof TourBackstage === 'undefined') return;
const DOCKS = [
  // land, level, Wormhole target, label (at most 14), layout variant, a Brady Button's rule (optional)
  ['ec', 3, '3-6', 'BRAZIL', 0],        // 2-3 Booby Dash -> Rio Hang-Glide (one land ahead)
  ['br', 1, '4-6', 'MOZAMBIQUE', 1, 7], // 3-1 Samba Sunrise -> Buried Dhow; Brady Button: Piwi's Rule 7, NO HATS
  ['mz', 1, '4-4', 'HATCHLINGS', 2],    // 4-1 Ostrich Dash -> Hatchling Night (in the land)
  ['ma', 3, '7-6', 'FRANCE', 0],        // 5-3 Chefchaouen Blue -> Seine Chase (two lands ahead)
  ['es', 3, '6-6', 'AQUARIUM', 1],      // 6-3 City of Arts by Night -> Oceanogràfic (in the land)
  ['fr', 2, '8-6', 'NETHERLANDS', 2],   // 7-2 Lavender Magpie -> Windmill Row
  ['nl', 3, '10-6', 'VIETNAM', 0],      // 8-3 Bike Lane Rush -> Mekong Floating Market (two lands ahead)
  ['jp', 3, '12-7', 'NEPAL', 1],        // 11-3 Night of Things -> Piwi's Prop Depot
  ['np', 2, '13-2', 'ANTARCTICA', 2],   // 12-2 Yak Caravan Pass -> Upside-Down Pole (a second way south)
  ['aq', 1, '1-6', 'HOME', 0],          // 13-1 Ice Shelf Bowling -> Mexico's Pit of Swallows (all the way home)
  ['w22', 1, '22-5', 'THE DESK', 1]     // 22-1 The Station of Clocks -> The Writer's Desk (in the land)
];
for (const [cc, n, to, label, variant, button] of DOCKS) {
  if (!Tour.countries[cc] || !Tour.specOf(to)) continue;
  TourBackstage.addDock(cc, n, { to, label, variant, button, hint: 'Flight cases stacked by the gate, CREW ONLY over it...' });
}
})();
