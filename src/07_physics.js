/* ============================================================
   Physics — tile collision + player movement model
   (pure functions; also used by the level validator)
   ============================================================ */
const PHYS = {
  walk: 6.2 * TS, run: 9.6 * TS,
  accel: 26 * TS, airAccel: 22 * TS, decel: 30 * TS, turn: 58 * TS,
  jumpV: 17.4 * TS, jumpSpeedBonus: 0.12, gUp: 36 * TS, gDown: 84 * TS, maxFall: 19 * TS, jumpCut: 5.5 * TS,
  coyote: 0.09, buffer: 0.13, runDelay: 0.42,
  swimG: 9 * TS, swimMaxFall: 3.6 * TS, swimStroke: 6.4 * TS, swimMaxX: 4.4 * TS, swimAccel: 14 * TS, swimDrag: 8 * TS,
  springV: 25 * TS, springVLow: 16 * TS, stompV: 11 * TS, stompVHeld: 16.5 * TS,
  conveyor: 2.6 * TS,
  bounceLo: 13 * TS, bounceHi: 22.5 * TS   // bouncy surfaces (big-top canvas, speaker cones, couches)
};
// special surfaces, stored per tile in area.surf (shared by the game and the validator)
const SURF = { NONE: 0, BOUNCE: 1, STICKY: 2 };
function surfAt(area, tx, ty) {
  const s = area.surf; if (!s || tx < 0 || ty < 0 || tx >= area.W || ty >= area.H) return 0;
  return s[ty * area.W + tx];
}
// force zones (updrafts, currents, wind tunnels, dust-devil columns): rects in px with
// fx = sideways drift (px/s) and fy = vertical acceleration (px/s^2, negative = up) capped at vmax
function zoneForce(area, b) {
  const Z = area.zones; if (!Z || !Z.length) return null;
  const cx = b.x + b.w / 2, cy = b.y + b.h * 0.6;
  let fx = 0, fy = 0, vmax = 0, hit = false;
  for (const z of Z) {
    if (z.off) continue;
    if (cx < z.x || cx > z.x + z.w || cy < z.y || cy > z.y + z.h) continue;
    fx += z.fx || 0; fy += z.fy || 0; vmax = Math.max(vmax, z.vmax || 0); hit = true;
  }
  return hit ? { fx, fy, vmax } : null;
}
const PLAYER_DIM = { small: { w: 20, h: 28 }, big: { w: 22, h: 54 }, crouch: { w: 22, h: 30 } };

function tileAt(area, tx, ty) {
  if (tx < 0 || tx >= area.W) return T.HARD;
  if (ty < 0 || ty >= area.H) return T.EMPTY;
  return area.tiles[ty * area.W + tx];
}
function isSolidTile(t) { return SOLID[t] === 1; }

function regionFree(area, x, y, w, h) {
  const x0 = Math.floor(x / TS), x1 = Math.floor((x + w - 0.01) / TS);
  const y0 = Math.floor(y / TS), y1 = Math.floor((y + h - 0.01) / TS);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (SOLID[tileAt(area, tx, ty)]) return false;
  return true;
}

/*
  moveBody: axis-separated movement against tiles (+ optional platforms)
  b: {x,y,w,h,vx,vy}; sets b.onGround, b.groundTile, b.hitWall, b.bonks(list), b.ride
  opts: {semis:true, hidden:false, corner:false, platforms:[], extraDx:0}
*/
function moveBody(b, area, dt, opts) {
  opts = opts || {};
  const semis = opts.semis !== false;
  b.hitWall = 0; b.bonks = null;
  const wasGround = b.onGround;
  b.onGround = false;
  // ---- horizontal
  let dx = b.vx * dt + (opts.extraDx || 0);
  if (dx !== 0) {
    const nx = b.x + dx;
    const y0 = Math.floor((b.y + 0.5) / TS), y1 = Math.floor((b.y + b.h - 0.5) / TS);
    if (dx > 0) {
      const tx = Math.floor((nx + b.w - 0.001) / TS);
      let hit = false;
      for (let ty = y0; ty <= y1; ty++) if (SOLID[tileAt(area, tx, ty)]) { hit = true; break; }
      if (hit) { b.x = tx * TS - b.w; b.hitWall = 1; if (b.vx > 0) b.vx = 0; } else b.x = nx;
    } else {
      const tx = Math.floor(nx / TS);
      let hit = false;
      for (let ty = y0; ty <= y1; ty++) if (SOLID[tileAt(area, tx, ty)]) { hit = true; break; }
      if (hit) { b.x = (tx + 1) * TS; b.hitWall = -1; if (b.vx < 0) b.vx = 0; } else b.x = nx;
    }
  }
  // ---- vertical
  const dy = b.vy * dt;
  const oldBottom = b.y + b.h, oldTop = b.y;
  if (dy >= 0) {
    const nb = b.y + b.h + dy;
    const x0 = Math.floor((b.x + 0.5) / TS), x1 = Math.floor((b.x + b.w - 0.5) / TS);
    const rStart = Math.floor((oldBottom - 0.001) / TS), rEnd = Math.floor((nb - 0.001) / TS);
    let landed = false;
    for (let ty = Math.max(rStart, 0); ty <= rEnd && !landed; ty++) {
      const top = ty * TS;
      if (top < oldBottom - 0.5) continue;
      for (let tx = x0; tx <= x1; tx++) {
        const t = tileAt(area, tx, ty);
        if (SOLID[t] || (semis && t === T.SEMI && oldBottom <= top + 0.5)) {
          b.y = top - b.h; b.vy = 0; b.onGround = true; b.groundTile = t; b.groundTx = tx; b.groundTy = ty; landed = true;
          // prefer reporting the tile under the body's centre
          const cx = Math.floor((b.x + b.w / 2) / TS);
          const ct = tileAt(area, cx, ty);
          if (SOLID[ct] || ct === T.SEMI) { b.groundTile = ct; b.groundTx = cx; }
          break;
        }
      }
    }
    if (!landed) b.y = nb - b.h;
    // moving platforms (one-way tops)
    if (opts.platforms && b.vy >= 0) {
      for (const p of opts.platforms) {
        if (p.dead) continue;
        if (b.x + b.w <= p.x + 1 || b.x >= p.x + p.w - 1) continue;
        const prevTop = p.y - (p.dy || 0);
        if (oldBottom <= prevTop + 2.5 && b.y + b.h >= p.y - 0.01) {
          if (!b.onGround || p.y < b.y + b.h) {
            b.y = p.y - b.h; b.vy = 0; b.onGround = true; b.groundTile = T.SEMI; b.ride = p;
          }
        }
      }
    }
  } else {
    const nt = b.y + dy;
    const ty = Math.floor(nt / TS);
    let x0 = Math.floor((b.x + 0.5) / TS), x1 = Math.floor((b.x + b.w - 0.5) / TS);
    const hits = [];
    for (let tx = x0; tx <= x1; tx++) {
      const t = tileAt(area, tx, ty);
      if (SOLID[t] || (opts.hidden && t === T.HIDDEN && oldTop >= (ty + 1) * TS - 0.5)) hits.push(tx);
    }
    if (hits.length && opts.corner) {
      // corner correction: slide around a block edge if barely clipping it
      const CORR = 10;
      if (hits.length === 1) {
        const tx = hits[0];
        const overlapL = (tx + 1) * TS - b.x;       // body overlaps tile's right side
        const overlapR = b.x + b.w - tx * TS;       // body overlaps tile's left side
        if (overlapL > 0 && overlapL <= CORR && b.x > tx * TS && regionFree(area, (tx + 1) * TS, nt, b.w, b.h)) { b.x = (tx + 1) * TS; hits.length = 0; }
        else if (overlapR > 0 && overlapR <= CORR && b.x + b.w < (tx + 1) * TS && regionFree(area, tx * TS - b.w, nt, b.w, b.h)) { b.x = tx * TS - b.w; hits.length = 0; }
      }
    }
    if (hits.length) {
      b.y = (ty + 1) * TS; b.vy = 0;
      // the block hit is the one closest to the body's centre
      const cx = b.x + b.w / 2;
      hits.sort((a, c) => Math.abs((a + 0.5) * TS - cx) - Math.abs((c + 0.5) * TS - cx));
      b.bonks = [{ tx: hits[0], ty }];
    } else b.y = nt;
  }
  if (!b.onGround) b.ride = null;
  b.justLanded = b.onGround && !wasGround;
}

function bodyInWater(b, area) {
  if (area.water) return true;
  const tx = Math.floor((b.x + b.w / 2) / TS), ty = Math.floor((b.y + b.h * 0.4) / TS);
  return tileAt(area, tx, ty) === T.WATER;
}
// returns true if body overlaps a tile satisfying fn, using an inset box
function touchesTile(b, area, fn, inset) {
  inset = inset || 0;
  const x0 = Math.floor((b.x + inset) / TS), x1 = Math.floor((b.x + b.w - inset - 0.01) / TS);
  const y0 = Math.floor((b.y + inset) / TS), y1 = Math.floor((b.y + b.h - inset - 0.01) / TS);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) { const t = tileAt(area, tx, ty); if (fn(t, tx, ty)) return { t, tx, ty }; }
  return null;
}
function lavaContact(b, area) {
  return touchesTile(b, area, (t, tx, ty) => t === T.LAVA && (b.y + b.h) > ty * TS + 9, 3);
}
function spikeContact(b, area) {
  // expanded by 1px so resting on / pushing against spikes counts
  const x0 = Math.floor((b.x + 2) / TS), x1 = Math.floor((b.x + b.w - 2.01) / TS);
  const yb = Math.floor((b.y + b.h + 1) / TS), yt = Math.floor((b.y - 1) / TS);
  for (let tx = x0; tx <= x1; tx++) { if (tileAt(area, tx, yb) === T.SPIKES && b.onGround) return true; if (tileAt(area, tx, yt) === T.SPIKES_CEIL) return true; }
  const y0 = Math.floor((b.y + 3) / TS), y1 = Math.floor((b.y + b.h - 3) / TS);
  const xl = Math.floor((b.x - 1) / TS), xr = Math.floor((b.x + b.w + 1) / TS);
  for (let ty = y0; ty <= y1; ty++) { const a = tileAt(area, xl, ty), c = tileAt(area, xr, ty); if (a === T.SPIKES || a === T.SPIKES_CEIL || c === T.SPIKES || c === T.SPIKES_CEIL) return true; }
  return false;
}

/*
  playerPhysics: movement model for Brady. Mutates p.
  p: {x,y,w,h,vx,vy,onGround,coyote,jumpBuf,jumping,runT,airMax,facing,crouch,inWater,stroke}
  inp: {left,right,jump,jumpPressed,down,action}
  returns events {jump, bonks, landed, swim}
*/
function playerPhysics(p, inp, area, dt, platforms, opts) {
  opts = opts || {};
  const ev = { jump: false, bonks: null, landed: false, swim: false };
  const gm = (area.gravity || 1) * (opts.gScale == null ? 1 : opts.gScale); // gScale: toad flight and balloon float
  const water = bodyInWater(p, area);
  p.inWater = water;
  const dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
  const ice = p.onGround && p.groundTile === T.ICE;
  const gsurf = p.onGround ? surfAt(area, p.groundTx, p.groundTy) : 0;
  const sticky = gsurf === SURF.STICKY;
  const smul = (opts.speedMul || 1) * (sticky ? 0.5 : 1);
  if (dir) p.facing = dir;
  const zf = zoneForce(area, p);

  if (water) {
    const target = dir * PHYS.swimMaxX;
    p.vx = approach(p.vx, target, (dir ? PHYS.swimAccel : PHYS.swimDrag) * dt);
    if (inp.jumpPressed) {
      p.vy = Math.min(p.vy, 0) - PHYS.swimStroke * 0.85;
      if (p.vy < -PHYS.swimStroke) p.vy = -PHYS.swimStroke;
      p.stroke = 1; ev.swim = true;
      // leap out of water when at the surface
      if (!area.water) {
        const tx = Math.floor((p.x + p.w / 2) / TS), ty = Math.floor((p.y - 2) / TS);
        if (tileAt(area, tx, ty) !== T.WATER && !SOLID[tileAt(area, tx, ty)]) p.vy = -PHYS.jumpV * 0.8;
      }
    }
    p.vy += PHYS.swimG * gm * dt;
    if (p.vy > PHYS.swimMaxFall) p.vy = approach(p.vy, PHYS.swimMaxFall, 30 * TS * dt);
    if (inp.down) p.vy = approach(p.vy, PHYS.swimMaxFall * 1.4, 20 * TS * dt);
    if (zf && zf.fy) { p.vy += zf.fy * dt; if (zf.vmax && p.vy < -zf.vmax * 0.5) p.vy = -zf.vmax * 0.5; }
    p.jumping = false; p.coyote = 0; p.jumpBuf = 0;
    if (p.y < -TS) p.vy = Math.max(p.vy, 0);
  } else {
    // running: hold a direction on the ground for a moment (or hold action)
    if (p.onGround) {
      if (dir !== 0 && (sign(p.vx) === dir || p.vx === 0)) p.runT += dt;
      else if (dir === 0 || sign(p.vx) !== dir) p.runT = Math.max(0, p.runT - dt * 3);
    }
    const running = inp.action || p.runT > PHYS.runDelay;
    let maxS;
    if (p.onGround) { maxS = (running ? PHYS.run : PHYS.walk) * smul; p.airMax = maxS; }
    else maxS = Math.max(PHYS.walk * (opts.speedMul || 1), p.airMax || PHYS.walk);
    if (p.crouch && p.onGround) {
      p.vx = approach(p.vx, 0, PHYS.decel * (ice ? 0.15 : 0.6) * dt);
    } else if (dir !== 0) {
      let a;
      if (!p.onGround) a = PHYS.airAccel;
      else if (p.vx !== 0 && sign(p.vx) !== dir) a = PHYS.turn;
      else a = PHYS.accel;
      if (ice) a *= 0.32;
      if (Math.abs(p.vx) > maxS && sign(p.vx) === dir) p.vx = approach(p.vx, maxS * dir, PHYS.decel * 0.5 * dt);
      else p.vx = approach(p.vx, maxS * dir, a * dt);
    } else {
      const d = p.onGround ? PHYS.decel * (ice ? 0.1 : 1) : PHYS.decel * 0.25;
      p.vx = approach(p.vx, 0, d * dt);
    }
    // jump buffering + coyote time
    if (inp.jumpPressed) p.jumpBuf = PHYS.buffer;
    else p.jumpBuf -= dt;
    if (p.onGround) p.coyote = PHYS.coyote; else p.coyote -= dt;
    if (p.jumpBuf > 0 && p.coyote > 0 && !(p.crouch && opts.noCrouchJump)) {
      p.vy = -(PHYS.jumpV + Math.abs(p.vx) * PHYS.jumpSpeedBonus) * (opts.jumpBoost || 1) * (sticky ? 0.78 : 1);
      p.jumping = true; p.jumpBuf = 0; p.coyote = 0; p.onGround = false; p.ride = null;
      ev.jump = true;
    }
    // variable jump height
    if (p.jumping && !inp.jump && p.vy < -PHYS.jumpCut) p.vy = -PHYS.jumpCut;
    const g = (p.vy < 0 && inp.jump && p.jumping) ? PHYS.gUp : PHYS.gDown;
    p.vy += g * gm * dt;
    if (zf && zf.fy) {
      // updrafts lift Brady up to a terminal speed (or push him down, if fy > 0)
      p.vy += zf.fy * dt;
      if (zf.vmax && p.vy < -zf.vmax) p.vy = -zf.vmax;
      if (zf.fy < 0) p.jumping = false;
    }
    if (p.vy > PHYS.maxFall) p.vy = PHYS.maxFall;
    if (p.vy >= 0) p.jumping = false;
  }
  // conveyor carry
  let extraDx = 0;
  if (p.onGround && (p.groundTile === T.CONV_L || p.groundTile === T.CONV_R)) extraDx = (p.groundTile === T.CONV_L ? -1 : 1) * PHYS.conveyor * dt;
  if (opts.windDx) extraDx += opts.windDx * dt;
  if (zf && zf.fx) extraDx += zf.fx * dt;
  if (p.carryVx && !p.onGround) extraDx += p.carryVx * dt;
  const wasGround = p.onGround;
  moveBody(p, area, dt, { semis: !(p.dropT > 0), hidden: true, corner: true, platforms, extraDx });
  if (p.onGround || p.hitWall) p.carryVx = 0;
  ev.bonks = p.bonks;
  ev.landed = p.onGround && !wasGround;
  // bouncy surfaces: big-top canvas, speaker cones, couches (hold jump to go higher)
  if (p.onGround && !p.inWater && surfAt(area, p.groundTx, p.groundTy) === SURF.BOUNCE && !(p.ride)) {
    p.vy = -(inp.jump ? PHYS.bounceHi : PHYS.bounceLo) * (opts.jumpBoost || 1);
    p.onGround = false; p.jumping = !!inp.jump; p.coyote = 0; p.jumpBuf = 0; ev.bounce = true;
  }
  if (p.stroke > 0) p.stroke = Math.max(0, p.stroke - dt * 2.5);
  return ev;
}

function newPlayerBody(x, y, big) {
  const d = big ? PLAYER_DIM.big : PLAYER_DIM.small;
  return { x: x - d.w / 2, y: y - d.h, w: d.w, h: d.h, vx: 0, vy: 0, onGround: false, coyote: 0, jumpBuf: 0, jumping: false, runT: 0, airMax: PHYS.walk, facing: 1, crouch: false, inWater: false, stroke: 0, groundTile: 0, ride: null, dropT: 0 };
}
