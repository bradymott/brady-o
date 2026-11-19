/* ============================================================
   World tour: solid boss art that reaches past the boss's hurt box.
   Measured in the browser (every boss, every act / pose / facing,
   the drawn art against the box: tools in carry-out/boss_reach.js,
   the cases in tools/sbw_hits_test.js). Where a clearly solid,
   dangerous-looking part (a beak, a claw, a head, a pan handle, a
   spout) stuck out past the box at Brady's height, Brady walked
   into it and nothing happened. These boxes make such a part touch
   Brady exactly as the boss's body does (Boss.touchPlayer: a stomp
   from above, the reel after a hit and an open weak spot are still
   safe, the hit ladder in 28_tour_hc_hits.js takes one thing).
   Soft trailing bits (tails, whiskers, feathers, streamers, smoke,
   steam, a wind-up key, scenery like a throne) stay harmless.
   El Tortugón's head lives in 29_tour_ec.js (the first case found).
   Boxes: [front offset from the box edge (px, past it), length (px),
   top (px from the box top; negative = above it), height (px)];
   'both' = on both sides; acts / poses / dir limit when the part is
   out (the art is not always a mirror image).
   ============================================================ */
const BossReach = {
  LIST: {
    br_toucan: [{ part: 'beak', box: [0, 34, 6, 28] }],                                    // the big beak, every pose (lower in a swoop)
    mz_hermit: [{ part: 'claw', acts: ['lunge'], box: [0, 32, 2, 38] }],                   // the lunging claw (passive in a shell)
    np_tinyak: [{ part: 'head', box: [0, 16, -6, 36] }],                                    // the head and horns
    es_paella: [{ part: 'handle', both: true, notPoses: ['skate'], box: [0, 24, 20, 8] }],  // the pan's iron handles
    ma_berrad: [{ part: 'spout', poses: ['pour'], dir: -1, box: [0, 70, 22, 32] },          // the spout when he tips to pour (left)
      { part: 'spout', poses: ['pour'], dir: 1, box: [0, 76, -10, 56] }],                  // (right: the tipped pot itself leans out too)
    vn_phin: [{ part: 'filter', poses: ['pour'], box: [0, 20, 0, 55] }]                     // the filter tipping over
  },
  // the world boxes of a boss's reaching parts right now
  boxes(b) {
    const L = this.LIST[b.style]; if (!L) return null;
    const out = [];
    for (const r of L) {
      if (r.acts && r.acts.indexOf(b.act) < 0) continue;
      if (r.poses && r.poses.indexOf(b.pose) < 0) continue;
      if (r.notPoses && r.notPoses.indexOf(b.pose) >= 0) continue;
      if (r.dir && r.dir !== (b.dir || 1)) continue;
      const [off, len, top, h] = r.box;
      for (const d of r.both ? [-1, 1] : [b.dir || 1]) {
        const x = d > 0 ? b.x + b.w + off : b.x - off - len;
        out.push({ x, y: b.y + top, w: len, h, part: r.part });
      }
    }
    return out;
  },
  // a frame: Brady inside a reaching part (and not already touching the body) is touched by the boss
  check(g) {
    const b = g.boss, p = g.player;
    if (!b || b.remove || b.state !== 'fight' || !p || p.dead || p.state !== 'play' || overlap(p, b)) return;
    const bx = this.boxes(b); if (!bx) return;
    for (const q of bx) if (overlap(p, q)) { b.touchPlayer(p); return; }
  }
};
if (typeof TourHooks !== 'undefined') TourHooks.on('playUpdate', (g) => { if (g.level && g.level.tour && g.state === 'play') BossReach.check(g); });
try { window.BRADY_HITS = Object.assign(window.BRADY_HITS || {}, { BossReach }); } catch (e) { /* not in a browser */ }
