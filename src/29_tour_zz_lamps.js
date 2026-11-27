/* ============================================================
   Secret rooms: the prize cage opens AT the win, wherever Brady stands. Like every entity the cage only runs inside
   the active window (the view and a few tiles past it), so a game won far from it (a lamp at the other end of the
   room) opened it only as he walked over: the door sound and the confetti came late and off-screen. Now the win
   steps every prize cage in the room once (it sees the room's key and opens: tiles, sound, confetti), and when the
   cage is off-screen a short toast points the way to it.
   ============================================================ */
(function () {
  const win0 = TourRooms.win;
  TourRooms.win = function (play, A, R, opts) {
    const first = !R.won;
    const r = win0.apply(this, arguments);
    if (!first || !R.won) return r;
    const Cage = ENTITY_TYPES.roomCage;
    for (const e of play.entities) {
      if (!(e instanceof Cage) || e.remove || e.open) continue;
      try { e.update(0); } catch (err) { /* the cage still opens when it comes into the window */ }
      const vx0 = play.camX, vx1 = play.camX + Game.viewW;
      if (e.open && (e.x + e.w < vx0 || e.x > vx1)) {
        play.toast(e.cx > vx1 ? 'PRIZE →' : '← PRIZE'); play.toastT = 2;
      }
    }
    return r;
  };
})();
