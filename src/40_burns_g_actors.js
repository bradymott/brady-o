/* ============================================================
   BRADY GOES TO BURNING MAN — actors: NPCs, enemies, behaviours, projectiles,
   shockwaves, pickups, particles and the Man boss controller.
   Behaviours are data: BurnsBehaviors.register(name, { init, update, hit, talk }).
   ============================================================ */

const BURNS_LINES = {
  burner: ['Welcome home, stranger!', "I'm not lost. I'm exploring.", 'Hydrate or die-drate!', "My camp is at... over there.", 'Radical self-expression, baby!', 'I gifted my shoes. Regret.', 'Is it Tuesday? Does it matter?', 'Dusty out here, huh?'],
  furcoat: ["It's not a costume. It's a lifestyle.", 'Faux fur, real feelings.', 'Too hot? Never heard of her.'],
  tutu: ['Tulle is a renewable resource.', 'Twirl with me!', 'Goggles on, mind open.'],
  ledsuit: ['Battery at 4%. Living at 100%.', 'Blink if you love me!', 'They can see me from space.'],
  greeter: ['Welcome home!', 'First burn? Roll in the dust!', 'Hugs are mandatory. Kidding. Mostly.'],
  gate: ['Ticket and ID, please.', 'No ticket, no entry.', 'Anyone hiding in the bathroom?'],
  campLead: ['Has anyone seen the zip ties?!', 'Build meeting in five! FIVE!', 'Who is on the MOOP sweep?!'],
  driver: ["I've been driving for six days.", 'What... day is it?', 'Is THIS the line?', 'Six. Days.'],
  ranger: ['Everything okay here?', 'Stay hydrated, friend.', "I'm not a cop. I'm a Ranger."],
  dpw: ['Outta the way, sparkle pony.', "We built this city. You're welcome.", 'Hard hat zone.'],
  techbro: ['Have you heard of my startup?', "It's like rideshare, but for dust.", "Let's circle back after the burn."],
  sparklepony: ['Can I borrow some water? And food? And a tent?', "I'm, like, so dehydrated.", 'Does this glitter make me look thirsty?'],
  influencer: ['Hold on, the light is PERFECT.', 'This is for the content.', "Move, babe. You're in my shot."],
  crusty: ['It was better in the old days.', 'Back then the Man was twelve feet tall.', 'You call that dust?'],
  chinka: ['Brady!', 'Took you long enough!']
};
const BURNS_PITCHES = ['AI FOR DUST!', 'WEB3 TENTS!', 'SYNERGY!', 'BLOCKCHAIN BURN!', 'DISRUPT!', 'PIVOT!', 'NFT GOGGLES!', 'SERIES A!'];

/* ---------------- actor ---------------- */
class BurnsActor {
  constructor(g, def) {
    this.g = g; this.def = def; this.id = def.id || null;
    this.type = def.type || 'burner';
    this.friendly = def.friendly !== false;
    const spec = def.spec || (this.type === 'chinka' ? BurnsRig.chinkaSpec() : this.type === 'brady' ? BurnsRig.bradySpec('none') : BurnsRig.npcSpec(this.type, def.seed || 0, def));
    this.model = def.model || BurnsRig.model(spec);
    this.ch = new BurnsChar(this.model);
    this.scale = def.scale || 1; this.ch.scale = this.scale;
    this.x = def.x || 0; this.z = def.z || 0;
    this.y = def.y !== undefined ? def.y : g.world.height(this.x, this.z);
    this.yaw = def.yaw || 0;
    this.vx = 0; this.vy = 0; this.vz = 0; this.grounded = true;
    this.home = { x: this.x, z: this.z, y: this.y, yaw: this.yaw };
    this.r = 0.36 * this.scale; this.h = (this.model.height || 1.8) * this.scale;
    this.hp = def.hp || 1; this.maxHp = this.hp;
    this.t = Math.random() * 5; this.st = 'idle'; this.stT = 0;
    this.bubbleText = null; this.bubbleT = 0;
    this.chatT = 4 + Math.random() * 10;
    this.hurtT = 0; this.invT = 0; this.defeated = false; this.removed = false; this.hidden = false;
    this.name = def.name || null;
    this.data = {};
    this.speed = def.speed || 1.4;
    this.setBehavior(def.behavior || 'idle');
  }
  setBehavior(name) { this.behName = name; this.beh = BurnsBehaviors.get(name); this.data = {}; this.stT = 0; if (this.beh.init) this.beh.init(this, this.g); }
  get canTalk() { return !this.hidden && this.friendly && !this.def.noTalk && !!(this.def.lines || this.def.talk || this.def.gift || this.beh.talk); }
  get boss() { return !!this.def.boss; }
  say(text, dur) { this.bubbleText = text; this.bubbleT = dur || Math.max(2.2, text.length * 0.07); this.bubbleChat = false; }
  face(tx, tz, dt, rate) { const t = Math.atan2(tx - this.x, tz - this.z); this.yaw = BurnsM.dampAngle(this.yaw, t, rate || 6, dt); }
  distP() { const p = this.g.player; return Math.hypot(p.x - this.x, p.z - this.z); }
  // steer toward a point; returns remaining distance
  moveTo(tx, tz, speed, dt, stopAt) {
    const dx = tx - this.x, dz = tz - this.z, d = Math.hypot(dx, dz);
    if (d <= (stopAt || 0.3)) { this.vx = BurnsM.damp(this.vx, 0, 8, dt); this.vz = BurnsM.damp(this.vz, 0, 8, dt); return d; }
    this.vx = BurnsM.damp(this.vx, dx / d * speed, 6, dt); this.vz = BurnsM.damp(this.vz, dz / d * speed, 6, dt);
    this.yaw = BurnsM.dampAngle(this.yaw, Math.atan2(dx, dz), 7, dt);
    return d;
  }
  physics(dt) {
    const W = this.g.world;
    this.x += this.vx * dt; this.z += this.vz * dt;
    if (this.def.collide !== false && !this.def.fixedY) {
      const hit = W.push(this, this.r, this.y, this.h, 0.45);
      if (hit && this.data) this.data.bump = (this.data.bump || 0) + 1;
    }
    if (this.def.fixedY) return;
    const s = W.surface(this.x, this.z, this.y + 0.5, this.r * 0.5, BURNS_SURF);
    if (this.grounded && s.y <= this.y + 0.5 && s.y > this.y - 0.6 && this.vy <= 0) { this.y = s.y; this.vy = 0; }
    else {
      this.vy -= 26 * dt; this.y += this.vy * dt;
      if (this.y <= s.y) { this.y = s.y; this.vy = 0; this.grounded = true; } else this.grounded = false;
    }
    // stay inside the world
    const B = W.bounds; this.x = clamp(this.x, B.x0, B.x1); this.z = clamp(this.z, B.z0, B.z1);
  }
  // overlap test against the player (cylinders)
  touching(extra) {
    const p = this.g.player, d = Math.hypot(p.x - this.x, p.z - this.z);
    return d < this.r + p.r + (extra || 0) && p.y < this.y + this.h && p.y + p.h > this.y;
  }
  update(dt) {
    this.t += dt; this.stT += dt;
    if (this.invT > 0) this.invT -= dt;
    if (this.hurtT > 0) this.hurtT -= dt;
    if (this.bubbleT > 0) { this.bubbleT -= dt; if (this.bubbleT <= 0) this.bubbleText = null; }
    if (!this.hidden) this.beh.update(this, this.g, dt);
    // ambient chatter when the player walks by
    // (held while a dialogue box is open, in cutscenes and during modal minigames: DJ sets, rhythm rounds, g.modal)
    if (this.friendly && !this.boss && !this.g.dialog.open && !this.g.cine && !(this.g.modalOn && this.g.modalOn()) && this.def.chatter !== false) {
      this.chatT -= dt;
      if (this.chatT <= 0) {
        this.chatT = 7 + Math.random() * 12;
        const d = this.distP();
        if (d < 9 && d > 1.2) { const TY = BURNS_NPC_TYPES[this.type], L = this.def.chat || (TY && TY.lines) || BURNS_LINES[this.type]; if (L && L.length) { this.say(L[Math.floor(Math.random() * L.length)]); this.bubbleChat = true; } }
      }
    }
  }
  // the player hits this actor. kind: spin | stomp | pound | puke | giant | love | bike
  hit(kind, fromX, fromZ) {
    if (this.defeated || this.invT > 0 || this.hidden) return false;
    if (this.beh.hit) { const r = this.beh.hit(this, this.g, kind); if (r === false) return false; if (r === 'handled') return true; }
    if (this.friendly && !this.def.hittable) return false;
    // love (molly) wins ordinary burners over; a boss only takes it as one bonk
    const bossy = !!(this.boss || this.def.boss || (this.def.hp || 1) > 3);
    if (kind === 'love' && !bossy) { this.befriend(); return true; }
    if (kind === 'love') this.g.fx.hearts(this.x, this.y + this.h * 0.8, this.z, 8);
    this.hp -= (kind === 'pound' || kind === 'giant') ? 2 : 1;
    this.invT = kind === 'love' ? 1.2 : 0.45; this.hurtT = 0.35;
    const dx = this.x - (fromX === undefined ? this.g.player.x : fromX), dz = this.z - (fromZ === undefined ? this.g.player.z : fromZ), d = Math.hypot(dx, dz) || 1;
    if (!this.boss) { this.vx = dx / d * 6; this.vz = dz / d * 6; this.vy = 5; this.grounded = false; }
    this.g.fx.burst(this.x, this.y + this.h * 0.6, this.z, 'star', 8, '#ffe24a');
    burnsSfx(this.hp <= 0 ? 'stomp' : 'bossHit', { vol: 0.7 });
    if (this.hp <= 0) this.defeat(kind);
    else if (this.def.onHurt) this.def.onHurt(this.g, this);
    return true;
  }
  defeat(kind) {
    this.defeated = true; this.friendly = true; this.hp = 0;
    const g = this.g;
    g.fx.confetti(this.x, this.y + 1.5, this.z, 26);
    const drop = this.def.drop === undefined ? 2 : this.def.drop;
    for (let i = 0; i < drop; i++) { const a = Math.random() * TAU; g.spawnPickup('glowstick', this.x + Math.cos(a) * 1.2, this.y + 0.9, this.z + Math.sin(a) * 1.2, { pop: true }); }
    this.say(this.def.defeatLine || (kind === 'love' ? 'I love everybody!' : ['Okay okay, I\'ll chill!', 'Radical self-reliance... failed.', 'I need a nap.', 'Fine. Hugs instead.'][Math.floor(Math.random() * 4)]), 2.5);
    g.missions.event('defeat', this);
    if (this.def.onDefeat) this.def.onDefeat(g, this);
    if (!this.removed && !this.def.keepBehavior) this.setBehavior(this.def.afterDefeat || (this.type === 'driver' ? 'sleep' : 'chill'));
  }
  befriend() {
    if (this.defeated) return;
    this.g.fx.hearts(this.x, this.y + 1.8, this.z, 10);
    burnsSfx('molly', { vol: 0.6 });
    this.ch.faceOverride = 3;
    this.defeat('love');
    this.setBehavior('dance');
  }
  draw(R) {
    if (this.hidden || this.removed) return;
    const ch = this.ch;
    ch.x = this.x; ch.y = this.y; ch.z = this.z; ch.yaw = this.yaw;
    ch.tint = this.hurtT > 0 ? [1, 1, 1, 0.55 * (this.hurtT / 0.35)] : null;
  }
}
const BURNS_SURF = { y: 0, col: null };

/* ---------------- behaviours ---------------- */
const BurnsBehaviors = {
  list: {},
  register(name, b) { this.list[name] = b; return b; },
  get(name) { return this.list[name] || this.list.idle; }
};
(() => {
  const R = (n, b) => BurnsBehaviors.register(n, b);
  const typeAnim = a => { const T = BURNS_NPC_TYPES[a.type]; return (T && T.anim) || ({ campLead: 'clipboard', techbro: 'phone', influencer: 'photo' })[a.type] || 'idle'; };
  // stand around, turn toward the player when near
  R('idle', {
    update(a, g, dt) {
      const d = a.distP();
      if (d < 6 && a.def.lookAt !== false) a.face(g.player.x, g.player.z, dt, 3);
      a.ch.play(a.bubbleText && a.bubbleT > 0 && d < 10 ? 'talk' : (a.def.anim || typeAnim(a)));
      a.vx = a.vz = 0; a.physics(dt);
    }
  });
  R('chill', { // defeated enemies: sit down or dance it out
    init(a) { a.data.dance = Math.random() < 0.5; a.ch.play(a.data.dance ? 'dance' : 'sit', { style: Math.floor(Math.random() * 6) }); },
    update(a, g, dt) { a.ch.play(a.data.dance ? 'dance' : 'sit', a.ch.k); a.vx = BurnsM.damp(a.vx, 0, 5, dt); a.vz = BurnsM.damp(a.vz, 0, 5, dt); a.physics(dt); }
  });
  R('dance', {
    init(a) { a.ch.play('dance', { style: a.def.style !== undefined ? a.def.style : Math.floor(Math.random() * 6), bpm: a.def.bpm || 118 + Math.random() * 12 }); },
    update(a, g, dt) { a.ch.play('dance', a.ch.k); a.yaw += Math.sin(a.t * 0.4) * dt * 0.4; a.vx = BurnsM.damp(a.vx, 0, 5, dt); a.vz = BurnsM.damp(a.vz, 0, 5, dt); a.physics(dt); }
  });
  R('sit', { update(a, g, dt) { a.ch.play('sit'); if (a.distP() < 5) a.face(g.player.x, g.player.z, dt, 2); a.vx = a.vz = 0; if (!a.def.fixedY) a.physics(dt); } });
  R('sleep', {
    update(a, g, dt) {
      a.ch.play('sleep'); a.vx = a.vz = 0;
      if (Math.random() < dt * 0.8) g.fx.zzz(a.x, a.y + a.h * 0.75, a.z);
      if (!a.def.fixedY) a.physics(dt);
    },
    talk(a, g) { if (a.def.onWake) { a.def.onWake(g, a); return true; } return false; },
    hit(a, g) { if (a.def.onWake) { a.def.onWake(g, a); return 'handled'; } return false; }
  });
  R('wander', {
    init(a) { a.data.wait = Math.random() * 3; a.data.tx = a.x; a.data.tz = a.z; },
    update(a, g, dt) {
      const D = a.data, rad = a.def.radius || 6;
      if (D.wait > 0) { D.wait -= dt; a.vx = BurnsM.damp(a.vx, 0, 6, dt); a.vz = BurnsM.damp(a.vz, 0, 6, dt); a.ch.play(a.distP() < 4 ? 'talk' : 'idle'); if (a.distP() < 5) a.face(g.player.x, g.player.z, dt, 3); }
      else {
        const d = a.moveTo(D.tx, D.tz, a.speed, dt, 0.5);
        a.ch.play('walk', { rate: a.speed / 1.4 });
        if (d < 0.6 || (D.bump || 0) > 40) { D.bump = 0; D.wait = 1.5 + Math.random() * 4; const t = Math.random() * TAU, r = Math.sqrt(Math.random()) * rad; D.tx = a.home.x + Math.cos(t) * r; D.tz = a.home.z + Math.sin(t) * r; }
      }
      a.physics(dt);
    }
  });
  // follow a path: def.path [[x,z],...], def.loop (default true) | pingpong
  R('walk', {
    init(a) { a.data.i = 0; a.data.dir = 1; },
    update(a, g, dt) {
      const P = a.def.path; if (!P || !P.length) { a.physics(dt); return; }
      const tgt = P[a.data.i];
      const d = a.moveTo(tgt[0], tgt[1], a.speed, dt, 0.4);
      a.ch.play(a.def.walkAnim || 'walk', { rate: a.speed / 1.4 });
      if (d < 0.5) {
        if (a.def.pingpong) { if (a.data.i + a.data.dir >= P.length || a.data.i + a.data.dir < 0) a.data.dir *= -1; a.data.i += a.data.dir; }
        else a.data.i = (a.data.i + 1) % P.length;
      }
      a.physics(dt);
    }
  });
  // companion: stays near the player (escort / buddy)
  R('follow', {
    update(a, g, dt) {
      const p = g.player, d = a.distP(), dist = a.def.followDist || 2.6;
      if (d > 30) { a.x = p.x - Math.sin(p.yaw) * 2; a.z = p.z - Math.cos(p.yaw) * 2; a.y = p.y; }
      if (d > dist) { const sp = d > 8 ? 7.5 : d > 4 ? 5.5 : 3; a.moveTo(p.x, p.z, sp, dt, dist * 0.8); a.ch.play(d > 4 ? 'run' : 'walk', { rate: d > 4 ? 0.9 : 1 }); }
      else { a.moveTo(a.x, a.z, 0, dt); a.face(p.x, p.z, dt, 4); a.ch.play(a.def.idleAnim || 'idle'); }
      if (!a.grounded || p.y > a.y + 1.2) { if (a.grounded && p.grounded && p.y > a.y + 1.2 && d < 4) { a.vy = 11; a.grounded = false; } }
      a.physics(dt);
    }
  });
  /* ---------- enemies ---------- */
  const contact = (a, g, dmg, kb) => {
    if (a.defeated || a.friendly) return false;
    if (!a.touching(0.05)) return false;
    const p = g.player;
    if (p.giant > 0 || (p.power === 'molly' && p.powerT > 0)) { a.hit(p.power === 'molly' ? 'love' : 'giant'); return true; }
    if (p.vy < -1 && p.y > a.y + a.h * 0.55) return false; // the player is landing on our head: stomp handled by the player
    p.hurt(dmg === undefined ? 1 : dmg, a.x, a.z, kb);
    return true;
  };
  BurnsBehaviors.contact = contact;
  // patrol a path; spot the player in a vision cone -> chase (or report for stealth)
  R('patrol', {
    init(a) { a.data.i = 0; a.data.alert = 0; },
    update(a, g, dt) {
      const p = g.player, D = a.data;
      const seen = BurnsBehaviors.sees(a, g, a.def.view || 10, a.def.fov || 0.6);
      if (seen) { D.alert = Math.min(1, D.alert + dt * 2.5); if (D.alert >= 1 && !D.chasing) { D.chasing = true; a.say(a.def.spotLine || 'HEY! YOU!', 1.5); g.missions.event('spotted', a); if (a.def.onSpot) a.def.onSpot(g, a); } }
      else D.alert = Math.max(0, D.alert - dt * 0.6);
      if (D.chasing && a.def.chase !== false) {
        const d = a.moveTo(p.x, p.z, (a.def.chaseSpeed || 4.2), dt, 0.6);
        a.ch.play('run', { rate: 0.85 });
        if (d > 18) D.chasing = false;
        contact(a, g, a.def.damage);
      } else {
        const P = a.def.path || [[a.home.x, a.home.z], [a.home.x + 6, a.home.z]];
        const d = a.moveTo(P[D.i][0], P[D.i][1], a.speed, dt, 0.4);
        a.ch.play('walk');
        if (d < 0.5) D.i = (D.i + 1) % P.length;
        contact(a, g, a.def.damage);
      }
      a.physics(dt);
    }
  });
  BurnsBehaviors.sees = (a, g, range, halfFov) => {
    const p = g.player, dx = p.x - a.x, dz = p.z - a.z, d = Math.hypot(dx, dz);
    if (d > range || p.hiddenT > 0) return false;
    const ang = Math.abs(BurnsM.wrap(Math.atan2(dx, dz) - a.yaw));
    if (ang > halfFov) return false;
    return g.world.raycast(a.x, a.y + 1.6, a.z, p.x, p.y + 1.2, p.z, true) > 0.97;
  };
  R('chase', {
    update(a, g, dt) {
      const p = g.player, d = a.distP(), aggro = a.def.aggro || 11;
      if (d < aggro && Math.abs(p.y - a.y) < 4) { a.moveTo(p.x, p.z, a.def.chaseSpeed || 3.6, dt, 0.5); a.ch.play('run', { rate: 0.8 }); if (Math.random() < dt * 0.15 && a.def.taunts) a.say(a.def.taunts[Math.floor(Math.random() * a.def.taunts.length)], 1.6); }
      else { const dh = a.moveTo(a.home.x, a.home.z, a.speed, dt, 0.5); a.ch.play(dh > 0.6 ? 'walk' : 'idle'); }
      contact(a, g, a.def.damage);
      a.physics(dt);
    }
  });
  // zombie shuffle (exhausted 6-day drivers): slow, relentless, sleepy
  R('zombie', {
    update(a, g, dt) {
      const d = a.distP();
      if (d < (a.def.aggro || 9)) { a.moveTo(g.player.x, g.player.z, a.def.chaseSpeed || 1.25, dt, 0.4); }
      else { if (!a.data.tx || Math.random() < dt * 0.2) { const t = Math.random() * TAU; a.data.tx = a.home.x + Math.cos(t) * 4; a.data.tz = a.home.z + Math.sin(t) * 4; } a.moveTo(a.data.tx, a.data.tz, 0.7, dt, 0.5); }
      a.ch.play('shuffle', { rate: 0.8 });
      if (Math.random() < dt * 0.12) a.say(['Six... days...', 'Mmmh... coffee...', 'Are we there yet...', 'Is this... the line?'][Math.floor(Math.random() * 4)], 2);
      contact(a, g, a.def.damage === undefined ? 1 : a.def.damage, 4);
      a.physics(dt);
    }
  });
  // charger: telegraph, then dash in a straight line; dizzy afterwards
  R('charger', {
    init(a) { a.data.mode = 'idle'; a.data.t = 1 + Math.random(); },
    update(a, g, dt) {
      const D = a.data, p = g.player, d = a.distP();
      D.t -= dt;
      if (D.mode === 'idle') { a.face(p.x, p.z, dt, 4); a.ch.play('idle'); a.moveTo(a.x, a.z, 0, dt); if (D.t <= 0 && d < (a.def.aggro || 14)) { D.mode = 'wind'; D.t = 0.9; a.say(a.def.chargeLine || '!!', 0.9); burnsSfx('yell', { vol: 0.5 }); } }
      else if (D.mode === 'wind') { a.face(p.x, p.z, dt, 8); a.ch.play('hug'); a.x += Math.sin(a.t * 60) * 0.01; if (D.t <= 0) { D.mode = 'dash'; D.t = a.def.dashTime || 1.1; D.dx = Math.sin(a.yaw); D.dz = Math.cos(a.yaw); } }
      else if (D.mode === 'dash') { const sp = a.def.dashSpeed || 10; a.vx = D.dx * sp; a.vz = D.dz * sp; a.ch.play('charge'); if (Math.random() < dt * 20) g.fx.dust(a.x, a.y + 0.1, a.z, 1); if (D.t <= 0 || (D.bump || 0) > 0) { D.bump = 0; D.mode = 'dizzy'; D.t = a.def.dizzy || 1.6; a.say('Whoa...', 1.2); } contact(a, g, a.def.damage, 7); }
      else if (D.mode === 'dizzy') { a.vx = BurnsM.damp(a.vx, 0, 5, dt); a.vz = BurnsM.damp(a.vz, 0, 5, dt); a.ch.play('hurt'); a.yaw += dt * 5; if (Math.random() < dt * 6) g.fx.burst(a.x, a.y + a.h + 0.1, a.z, 'star', 1, '#ffe24a'); if (D.t <= 0) { D.mode = 'idle'; D.t = 1.2 + Math.random(); } }
      a.physics(dt);
    }
  });
  // shouter (stressed camp leads): yells a ground shockwave — jump over it
  R('shouter', {
    init(a) { a.data.cd = 1.5 + Math.random() * 2; },
    update(a, g, dt) {
      const D = a.data, d = a.distP();
      D.cd -= dt;
      if (D.yell > 0) {
        D.yell -= dt; a.ch.play('yell'); a.face(g.player.x, g.player.z, dt, 6);
        if (D.yell <= 0) {
          g.shockwave({ x: a.x, z: a.z, y: a.y, speed: a.def.waveSpeed || 7.5, max: a.def.waveMax || 9, h: 0.65, dmg: 1, col: '#ff5a3a', from: a });
          burnsSfx('yell'); g.shake(0.15);
        }
      } else if (d < (a.def.aggro || 11) && D.cd <= 0) {
        D.yell = 0.55; D.cd = a.def.cooldown || (2.6 + Math.random() * 1.5);
        const L = a.def.taunts || ['WHERE ARE MY ZIP TIES?!', 'YOU! VOLUNTEER!', 'THE SHADE IS CROOKED!', 'MEETING IN FIVE!'];
        a.say(L[Math.floor(Math.random() * L.length)], 1.4);
      } else {
        // pace around home
        if (!D.tx || Math.random() < dt * 0.25) { const t = Math.random() * TAU; D.tx = a.home.x + Math.cos(t) * 3; D.tz = a.home.z + Math.sin(t) * 3; }
        const dd = a.moveTo(D.tx, D.tz, 1.6, dt, 0.4); a.ch.play(dd > 0.5 ? 'walk' : 'clipboard');
      }
      contact(a, g, a.def.damage);
      a.physics(dt);
    }
  });
  // flasher (influencers): charge the ring light, then flash a cone in front
  R('flasher', {
    init(a) { a.data.cd = 2 + Math.random() * 2; },
    update(a, g, dt) {
      const D = a.data, d = a.distP(), p = g.player;
      D.cd -= dt;
      if (D.charge > 0) {
        D.charge -= dt; a.face(p.x, p.z, dt, 5); a.ch.play('photo');
        if (D.charge <= 0) {
          burnsSfx('camera_flash');
          const ang = Math.abs(BurnsM.wrap(Math.atan2(p.x - a.x, p.z - a.z) - a.yaw));
          g.fx.flashAt(a.x + Math.sin(a.yaw) * 0.6, a.y + 1.9, a.z + Math.cos(a.yaw) * 0.6);
          if (d < (a.def.range || 11) && ang < 0.55 && g.world.raycast(a.x, a.y + 1.8, a.z, p.x, p.y + 1.2, p.z, true) > 0.95) { g.screenFlash('#ffffff', 0.45); p.hurt(1, a.x, a.z, 4); }
        }
      } else if (d < (a.def.aggro || 12) && D.cd <= 0) {
        D.charge = 1.0; D.cd = a.def.cooldown || 3.6;
        a.say(['SMILE!', 'CONTENT!', '#BLESSED!', 'HOLD STILL, BABE!'][Math.floor(Math.random() * 4)], 1.1);
      } else {
        if (!D.tx || Math.random() < dt * 0.3) { const t = Math.random() * TAU; D.tx = a.home.x + Math.cos(t) * 4; D.tz = a.home.z + Math.sin(t) * 4; }
        const dd = a.moveTo(D.tx, D.tz, 1.5, dt, 0.4); a.ch.play(dd > 0.5 ? 'walk' : 'photo');
      }
      contact(a, g, a.def.damage);
      a.physics(dt);
    }
  });
  // pitcher (tech bros): throws slow homing "pitch" bubbles
  R('pitcher', {
    init(a) { a.data.cd = 1.5 + Math.random() * 2; },
    update(a, g, dt) {
      const D = a.data, d = a.distP(), p = g.player;
      D.cd -= dt;
      if (d < (a.def.aggro || 14)) {
        a.face(p.x, p.z, dt, 4);
        if (D.cd <= 0) {
          D.cd = a.def.cooldown || 2.4;
          const txt = (a.def.pitches || BURNS_PITCHES)[Math.floor(Math.random() * (a.def.pitches || BURNS_PITCHES).length)];
          g.projectile({ kind: 'pitch', x: a.x + Math.sin(a.yaw) * 0.6, y: a.y + 1.6, z: a.z + Math.cos(a.yaw) * 0.6, speed: 3.6, homing: 1.6, life: 5, text: txt, dmg: 1, r: 0.55, from: a });
          burnsSfx('pitch_blah', { vol: 0.6 }); a.ch.play('talk');
        } else a.ch.play(D.cd > 1.6 ? 'talk' : 'phone');
        if (d < 4) { a.moveTo(a.x - (p.x - a.x), a.z - (p.z - a.z), 2.2, dt, 0.2); a.ch.play('walk'); }
        else a.moveTo(a.x, a.z, 0, dt);
      } else { a.ch.play('phone'); a.moveTo(a.home.x, a.home.z, 1.2, dt, 0.5); }
      contact(a, g, a.def.damage);
      a.physics(dt);
    }
  });
  // thief: sneaks up, grabs glow sticks, runs off (catch to get them back)
  R('thief', {
    init(a) { a.data.mode = 'sneak'; a.data.stolen = 0; },
    update(a, g, dt) {
      const D = a.data, p = g.player, d = a.distP();
      if (D.mode === 'sneak') {
        if (d < (a.def.aggro || 10)) { a.moveTo(p.x, p.z, 3.4, dt, 0.4); a.ch.play('walk', { rate: 1.6 }); }
        else { a.moveTo(a.home.x, a.home.z, 1.2, dt, 0.5); a.ch.play('idle'); }
        if (a.touching(0.1) && p.invT <= 0) {
          const n = Math.min(g.glow, a.def.steal || 5); g.glow -= n; D.stolen += n; D.mode = 'run'; D.t = 6;
          a.say(n ? 'Gifting goes both ways!' : 'Broke, huh? Rude.', 1.8); burnsSfx('hurt3d', { vol: 0.5 }); g.toast(n ? `-${n} GLOW STICKS! CATCH THE THIEF!` : 'NOTHING TO STEAL!');
        }
      } else {
        D.t -= dt; const ax = a.x - p.x, az = a.z - p.z, l = Math.hypot(ax, az) || 1;
        a.moveTo(a.x + ax / l * 5, a.z + az / l * 5, 5.6, dt, 0.1); a.ch.play('run');
        if (D.t <= 0) D.mode = 'sneak';
      }
      a.physics(dt);
    },
    hit(a, g) { if (a.data.stolen) { for (let i = 0; i < a.data.stolen; i++) { const t = Math.random() * TAU; g.spawnPickup('glowstick', a.x + Math.cos(t) * 1.4, a.y + 0.9, a.z + Math.sin(t) * 1.4, { pop: true }); } a.data.stolen = 0; } return true; }
  });
  /* ---------- greeter sub-bosses (World 1, reusable) ---------- */
  // big hug: charges arms open; a catch hugs Brady (lose 1 drop); misses leave her dizzy (vulnerable)
  R('greeterHug', {
    init(a) { a.data.mode = 'taunt'; a.data.t = 1.4; },
    hit(a, g) { if (a.data.mode !== 'dizzy') { a.say('No hitting! Only hugging!', 1.2); const p = g.player, dx = p.x - a.x, dz = p.z - a.z, d = Math.hypot(dx, dz) || 1; p.knock(dx / d * 8, 6, dz / d * 8); burnsSfx('bump'); return false; } return true; },
    update(a, g, dt) {
      const D = a.data, p = g.player; D.t -= dt;
      if (D.mode === 'taunt') { a.face(p.x, p.z, dt, 5); a.ch.play('wave'); a.moveTo(a.x, a.z, 0, dt); if (D.t <= 0) { D.mode = 'wind'; D.t = 0.8; a.say('BRING IT IN!', 0.9); burnsSfx('greeter_bell', { vol: 0.4 }); } }
      else if (D.mode === 'wind') { a.face(p.x, p.z, dt, 9); a.ch.play('hug'); if (D.t <= 0) { D.mode = 'run'; D.t = 1.6; D.dx = Math.sin(a.yaw); D.dz = Math.cos(a.yaw); } }
      else if (D.mode === 'run') {
        const want = Math.atan2(p.x - a.x, p.z - a.z); a.yaw = BurnsM.dampAngle(a.yaw, want, 1.4, dt); D.dx = Math.sin(a.yaw); D.dz = Math.cos(a.yaw);
        const sp = (a.def.dashSpeed || 8.5) * (a.hp < a.maxHp ? 1.15 : 1); a.vx = D.dx * sp; a.vz = D.dz * sp; a.ch.play('charge');
        if (Math.random() < dt * 14) g.fx.dust(a.x, a.y + 0.1, a.z, 1);
        if (a.touching(0.25) && p.invT <= 0) { D.mode = 'hugging'; D.t = 1.3; p.grab(a, 1.3); a.say('WELCOME HOOOOME!', 1.3); burnsSfx('crowd_cheer', { vol: 0.5 }); }
        else if (D.t <= 0 || (D.bump || 0) > 0) { D.bump = 0; D.mode = 'dizzy'; D.t = 2.4; a.say('Where... did you go?', 1.5); }
      }
      else if (D.mode === 'hugging') { a.ch.play('hug'); a.moveTo(a.x, a.z, 0, dt); g.fx.hearts(a.x, a.y + 2, a.z, Math.random() < dt * 6 ? 1 : 0); if (D.t <= 0) { p.release(true); D.mode = 'taunt'; D.t = 1.6; } }
      else if (D.mode === 'dizzy') { a.vx = BurnsM.damp(a.vx, 0, 4, dt); a.vz = BurnsM.damp(a.vz, 0, 4, dt); a.ch.play('hurt'); a.yaw += dt * 4; if (Math.random() < dt * 6) g.fx.burst(a.x, a.y + a.h + 0.1, a.z, 'star', 1, '#ffe24a'); if (D.t <= 0) { D.mode = 'taunt'; D.t = 1.0; } }
      a.physics(dt);
    }
  });
  // dust angel: leaps toward Brady, belly-flops (dust ring), then lies there making dust angels (vulnerable)
  R('greeterSlam', {
    init(a) { a.data.mode = 'walk'; a.data.t = 1.5; },
    hit(a, g) { if (a.data.mode !== 'angel') { a.say('Not yet! I\'m mid-ritual!', 1.0); return false; } return true; },
    update(a, g, dt) {
      const D = a.data, p = g.player; D.t -= dt;
      if (D.mode === 'walk') { a.moveTo(p.x, p.z, 2.0, dt, 3); a.ch.play('walk'); if (D.t <= 0 && a.grounded) { D.mode = 'leap'; D.tx = p.x; D.tz = p.z; const tt = 1.1; a.vx = (D.tx - a.x) / tt; a.vz = (D.tz - a.z) / tt; a.vy = 13; a.grounded = false; a.say('DUST ANGEL!', 1); burnsSfx('jump3d'); } }
      else if (D.mode === 'leap') {
        a.ch.play(a.vy > 0 ? 'jump' : 'fall'); a.face(D.tx, D.tz, dt, 6);
        if (a.grounded && a.stT > 0.2) {
          D.mode = 'angel'; D.t = a.hp < a.maxHp ? 2.0 : 2.6; D.mark = null; a.vx = a.vz = 0;
          g.shockwave({ x: a.x, z: a.z, y: a.y, speed: 9, max: 10, h: 0.6, dmg: 1, col: '#e8c8a0', from: a, dust: true });
          g.fx.dust(a.x, a.y + 0.2, a.z, 18); g.shake(0.35); burnsSfx('groundpound');
        }
      }
      else if (D.mode === 'angel') { a.ch.play('knocked'); a.vx = a.vz = 0; if (Math.random() < dt * 4) g.fx.dust(a.x + (Math.random() - 0.5) * 2, a.y + 0.1, a.z + (Math.random() - 0.5) * 2, 1); if (D.t <= 0) { D.mode = 'walk'; D.t = 1.6; a.vy = 4; a.grounded = false; } }
      if (D.mode !== 'leap') a.stT = 0; // stT times the leap
      a.physics(dt);
    }
  });
  // bell ringer: rings a giant bell -> concentric shockwaves; dizzy after (vulnerable)
  R('greeterBell', {
    init(a) { a.data.mode = 'move'; a.data.t = 2; },
    hit(a, g) { if (a.data.mode !== 'dizzy') { a.say('*DING* Nope!', 0.9); burnsSfx('greeter_bell', { vol: 0.5 }); return false; } return true; },
    update(a, g, dt) {
      const D = a.data, p = g.player; D.t -= dt;
      if (D.mode === 'move') { if (!D.tx || Math.random() < dt * 0.5) { const t = Math.random() * TAU; D.tx = a.home.x + Math.cos(t) * 6; D.tz = a.home.z + Math.sin(t) * 6; } a.moveTo(D.tx, D.tz, 3, dt, 0.4); a.ch.play('walk'); if (D.t <= 0) { D.mode = 'ring'; D.t = 2.1; D.n = 0; a.say('WELCOME HOME! *DING*', 1.5); } }
      else if (D.mode === 'ring') {
        a.face(p.x, p.z, dt, 4); a.moveTo(a.x, a.z, 0, dt); a.ch.play('bell');
        const n = a.hp < a.maxHp ? 4 : 3;
        if (D.t < 2.1 - (D.n + 1) * 0.5 && D.n < n) { D.n++; g.shockwave({ x: a.x, z: a.z, y: a.y, speed: 7, max: 13, h: 0.6, dmg: 1, col: '#ffd84a', from: a }); burnsSfx('greeter_bell'); }
        if (D.t <= 0) { D.mode = 'dizzy'; D.t = 2.6; a.say('Ow... my ears...', 1.4); }
      }
      else if (D.mode === 'dizzy') { a.vx = a.vz = 0; a.ch.play('hurt'); a.yaw += dt * 3; if (Math.random() < dt * 6) g.fx.burst(a.x, a.y + a.h + 0.1, a.z, 'star', 1, '#ffe24a'); if (D.t <= 0) { D.mode = 'move'; D.t = 2.5; } }
      a.physics(dt);
    }
  });
  /* ---------------- burner action-figure behaviours ---------------- */
  const T3 = [0, 0, 0];
  // fire spinner: spins poi / fans / staff / hoop (def.tool or the type's tool) with burning trails and a
  // flickering light; the flames hurt on touch (def.hazard: false to disable). def: { path, speed, turn, rate, spinning }
  R('firespin', {
    init(a) { a.data.tool = (a.model.spec && a.model.spec.tool) || a.def.tool || 'poi'; a.data.i = 0; },
    update(a, g, dt) {
      const D = a.data, P = a.def.path;
      if (P && P.length) { const q = P[D.i % P.length]; if (a.moveTo(q[0], q[1], a.def.speed || 1.2, dt, 0.5) < 0.6) D.i++; }
      else { a.vx = a.vz = 0; if (a.def.turn) a.yaw += a.def.turn * dt; }
      const on = a.def.spinning !== false;
      a.ch.play(on ? 'firespin' : 'idle', { tool: D.tool, rate: a.def.rate || 1 });
      if (on && a.def.hazard !== false && a.ch.computed && !g.cine) {
        const p = g.player, W = a.model.wicks || [];
        for (const w of W) {
          const q = a.ch.bonePoint(w.bone, w.p[0], w.p[1], w.p[2], T3), dx = p.x - q[0], dz = p.z - q[2], dy = p.y + 1.0 - q[1];
          if (dx * dx + dz * dz < 0.36 && Math.abs(dy) < 1.0) { if (p.hurt(1, a.x, a.z, 6)) { p.say(['HOT HOT HOT!', 'My eyebrows!', 'Not the bun!'][Math.floor(Math.random() * 3)], 1); g.fx.spark(q[0], q[1], q[2], 8); g.missions.event('burned', a); } break; }
        }
      }
      a.physics(dt);
    },
    draw(a, g, R) {
      const W = a.model.wicks;
      if (a.def.spinning === false || !W || !W.length) return;
      const cam = g.cam, d2 = (a.x - cam.x) * (a.x - cam.x) + (a.z - cam.z) * (a.z - cam.z); if (d2 > 85 * 85) return;
      const pr = Math.min(1, 7 / W.length); let cx = 0, cy = 0, cz = 0;
      for (const w of W) {
        const q = a.ch.bonePoint(w.bone, w.p[0], w.p[1], w.p[2], T3); cx += q[0]; cy += q[1]; cz += q[2];
        if (Math.random() < pr) g.fx.add(q[0], q[1], q[2], (Math.random() - 0.5) * 0.3, 0.5 + Math.random() * 0.5, (Math.random() - 0.5) * 0.3, 0.3 + Math.random() * 0.12, 0.36, 0.08, [1, 0.5 + Math.random() * 0.35, 0.15], 1, 'flame', 1, Math.random() * 6, 0);
        if (Math.random() < pr * 0.45) g.fx.add(q[0], q[1], q[2], 0, 0, 0, 0.16, 0.55, 0.2, [1, 0.72, 0.32], 0.8, 'glow', 1);
      }
      const n = W.length; g.pointLight(cx / n, cy / n + 0.3, cz / n, 7.5, [1, 0.55, 0.2], 1.15 + Math.sin(g.time * 23 + a.t) * 0.15);
    }
  });
  // darkwad: nearly invisible at night (just a glint off his shades) until light reveals him; bumping into
  // him knocks Brady down (and off the bike). ACTION with 3 glow sticks lights him up with EL wire.
  // def: { radius (wander), cost, lightable, elCol, lit, onBump(g,a), onLit(g,a) }  events: 'darkwadBump', 'lit'
  R('darkwad', {
    init(a) { a.data.cd = 0; if (a.def.lit) BurnsBehaviors.lightUp(a, a.g, true); },
    update(a, g, dt) {
      const D = a.data, p = g.player; D.cd = Math.max(0, D.cd - dt);
      if (a.def.radius) { if (!D.tx || Math.random() < dt * 0.25) { const t = Math.random() * TAU; D.tx = a.home.x + Math.cos(t) * a.def.radius; D.tz = a.home.z + Math.sin(t) * a.def.radius; } const d = a.moveTo(D.tx, D.tz, 0.8, dt, 0.4); a.ch.play(d > 0.5 ? 'walk' : 'idle'); }
      else { a.vx = a.vz = 0; a.ch.play('idle'); }
      a.cloak = !D.lit && !BurnsBehaviors.revealed(a, g);
      if (!D.lit && D.cd <= 0 && !g.cine && !p.dead && a.touching(0.2)) {
        D.cd = 2.2;
        if (p.vehicle && p.vehicle.kind === 'bike') p.vehicle.dismount(p, true);
        const dx = p.x - a.x, dz = p.z - a.z, d = Math.hypot(dx, dz) || 1;
        p.knock(dx / d * 5, 5, dz / d * 5); p.ch.play('knocked', null, true); burnsSfx('bump'); g.shake(0.2);
        p.say(['WHO PUT A PERSON THERE?!', 'Light yourself up, man!', 'DARKWAD!'][Math.floor(Math.random() * 3)], 1.4);
        a.say(['Watch it.', '...', 'I was here first.'][Math.floor(Math.random() * 3)], 1.4);
        g.missions.event('darkwadBump', a); if (a.def.onBump) a.def.onBump(g, a);
      }
      a.physics(dt);
    },
    talk(a, g) {
      if (a.data.lit || a.def.lightable === false) return false;
      const cost = a.def.cost === undefined ? 3 : a.def.cost;
      if (g.glow >= cost) { g.glow -= cost; BurnsBehaviors.lightUp(a, g); return true; }
      a.say(`Got ${cost} glow sticks? No? Then keep walking.`, 2); return true;
    },
    draw(a, g, R) { if (a.cloak && Math.random() < 0.04) { const q = a.ch.bonePoint(BURNS_BONES.HEAD, 0.075, 0.235, 0.215, T3); g.fx.glint(q[0], q[1], q[2], '#e8f0ff'); } }
  });
  // is a darkwad visible? daylight, LSD, standing right next to him, a carried light, headlights, light pools or fires
  BurnsBehaviors.revealed = (a, g) => {
    const p = g.player, env = g.env;
    if (env && env.sunDir && env.sunDir[1] > 0.12) return true;
    if (p.power === 'lsd' && p.powerT > 0) return true;
    const d = Math.hypot(p.x - a.x, p.z - a.z);
    if (d < 2.4) return true;
    if (p.lightR && d < p.lightR) return true;                 // set by worlds: lantern gift, flashlight...
    if (g.glow > 0 && d < 3.6) return true;                     // Brady's glow sticks
    const v = p.vehicle; if (v && d < 16) { const fx = Math.sin(v.yaw), fz = Math.cos(v.yaw); if (((a.x - p.x) * fx + (a.z - p.z) * fz) / (d || 1) > 0.82) return true; }
    let lit = 0; for (const L of g.world.lights) { const dx = L.x - a.x, dz = L.z - a.z; if (Math.abs(dx) > L.r || Math.abs(dz) > L.r) continue; const k = 1 - Math.hypot(dx, dz) / L.r; if (k > 0) { lit += (L.i || 0.5) * k * k; if (lit > 0.18) return true; } }
    for (const f of g.world.fires) if (Math.abs(f.x - a.x) < 5 && Math.abs(f.z - a.z) < 5) return true;
    return false;
  };
  BurnsBehaviors.lightUp = (a, g, silent) => {
    a.data.lit = true; a.cloak = false;
    const spec = BurnsRig.npcSpec(a.type === 'darkwad' ? 'darkwad' : a.type, a.def.seed || 0, a.def);
    spec.acc = (spec.acc || []).concat(['elwire']); spec.elCol = a.def.elCol || BURNS_NEON[(a.def.seed || 0) % 7]; spec.key += ':lit';
    a.model = BurnsRig.model(spec); a.ch.setModel(a.model);
    if (!silent) { g.fx.confetti(a.x, a.y + 1.6, a.z, 18); burnsSfx('pickup_glow'); a.say(['Whoa. I\'m... visible. I kind of love it.', 'Okay, the glow is a vibe.', 'Fine. FINE. I\'m radiant.'][Math.floor(Math.random() * 3)], 2.4); g.missions.event('lit', a); if (a.def.onLit) a.def.onLit(g, a); }
  };
  // undercover cop: "blends in" (dances badly, says groovy); spots Brady carrying an active power-up -> chases;
  // a catch confiscates it. Hide in a crowd (2+ dancing NPCs within 2.2 m) to lose him.
  // def: { path, view, fov, chaseSpeed, chaseTime, onConfiscate(g,a,id) }  events: 'copSpotted', 'confiscated'
  R('undercover', {
    init(a) { a.data.mode = 'blend'; a.data.t = 0; a.data.i = 0; },
    update(a, g, dt) {
      const D = a.data, p = g.player; D.t -= dt;
      const carrying = !!p.power && p.powerT > 0, hidden = BurnsBehaviors.inCrowd(g, p, a);
      if (D.mode === 'blend') {
        const P = a.def.path;
        if (P && P.length) { const q = P[D.i % P.length]; if (a.moveTo(q[0], q[1], 1.1, dt, 0.5) < 0.6) D.i++; a.ch.play('walk'); }
        else { a.vx = a.vz = 0; a.ch.play('robot'); }
        if (Math.random() < dt * 0.06) a.say(['Groovy.', 'Far out, fellow burner.', 'Nice... vibes.', 'I too enjoy the... untz.'][Math.floor(Math.random() * 4)], 1.8);
        if (Math.random() < dt * 0.05) { const q = a.ch.bonePoint(BURNS_BONES.CHEST, 0.08, 0.34, 0.16, T3); g.fx.glint(q[0], q[1], q[2], '#ffe08a'); }
        if (carrying && !hidden && !g.cine && BurnsBehaviors.sees(a, g, a.def.view || 11, a.def.fov || 1.1)) { D.mode = 'chase'; D.t = a.def.chaseTime || 9; a.say('FREEZE! I mean... groovy? FREEZE!', 1.6); g.missions.event('copSpotted', a); }
      } else if (D.mode === 'chase') {
        a.moveTo(p.x, p.z, a.def.chaseSpeed || 4.2, dt, 0.4); a.ch.play('run', { rate: 0.9 });
        if (!carrying || hidden || D.t <= 0 || a.distP() > (a.def.view || 11) * 1.8) { D.mode = 'lost'; D.t = 2.5; a.say(hidden ? 'Where\'d the bun go? You all look the same!' : 'Lost him. Groovy.', 2); }
        else if (a.touching(0.25) && !g.cine) {
          const id = p.power; p.endPower(true);
          g.toast(((BURNS_POWERUPS[id] && BURNS_POWERUPS[id].name) || 'POWER-UP') + ' CONFISCATED!');
          const dx = p.x - a.x, dz = p.z - a.z, d = Math.hypot(dx, dz) || 1; p.knock(dx / d * 4, 4, dz / d * 4);
          a.say('This is... confiscated. For science. Groovy.', 2.2); burnsSfx('bump'); D.mode = 'lost'; D.t = 4;
          g.missions.event('confiscated', { actor: a, power: id }); if (a.def.onConfiscate) a.def.onConfiscate(g, a, id);
        }
      } else { const dh = a.moveTo(a.home.x, a.home.z, 1.4, dt, 0.5); a.ch.play(dh > 0.6 ? 'walk' : 'idle'); if (D.t <= 0 && dh < 0.7) D.mode = 'blend'; }
      a.physics(dt);
    }
  });
  // lamplighter: walks a path carrying lanterns (a warm moving light) and hangs a glowing lantern
  // every `hang` metres, so dark streets light up behind them. def: { path, speed, hang (m, false = none), loop, col }
  // events: 'lanternHung' (per lantern), 'lampsDone' (end of a non-looping path)
  R('lamplight', {
    init(a) { a.data.i = 0; a.data.dist = 0; a.data.done = false; },
    update(a, g, dt) {
      const D = a.data, P = a.def.path;
      if (!P || !P.length || D.done) { a.vx = a.vz = 0; a.ch.play('lantern'); if (D.done || !P) { const d = a.distP(); if (d < 6) a.face(g.player.x, g.player.z, dt, 2); } a.physics(dt); return; }
      const q = P[D.i % P.length], x0 = a.x, z0 = a.z;
      if (a.moveTo(q[0], q[1], a.def.speed || 1.0, dt, 0.4) < 0.5) { D.i++; if (!a.def.loop && D.i >= P.length) { D.done = true; g.missions.event('lampsDone', a); } }
      a.ch.play('walk', { rate: 0.8 });
      D.dist += Math.hypot(a.x - x0, a.z - z0);
      const hang = a.def.hang === undefined ? 6 : a.def.hang;
      if (hang && D.dist >= hang) { D.dist = 0; const s = Math.sin(a.yaw + Math.PI / 2) * 0.6, c = Math.cos(a.yaw + Math.PI / 2) * 0.6; g.world.glows.push({ x: a.x + s, y: a.y + 1.9, z: a.z + c, s: 1.1, c: burnsRGBf(a.def.col || '#ffd890'), ph: Math.random() * 10, blink: 0, hidden: false }); g.missions.event('lanternHung', a); }
      a.physics(dt);
    },
    draw(a, g, R) { const cam = g.cam; if ((a.x - cam.x) * (a.x - cam.x) + (a.z - cam.z) * (a.z - cam.z) > 70 * 70) return; g.pointLight(a.x, a.y + 2.2, a.z, 9, burnsRGBf(a.def.col || '#ffd890'), 1.0); }
  });
  BurnsBehaviors.inCrowd = (g, p, except) => {
    let n = 0;
    for (const o of g.actors) { if (o === except || o.removed || o.hidden || !o.friendly) continue; const dx = o.x - p.x, dz = o.z - p.z; if (dx * dx + dz * dz < 4.84 && (o.behName === 'dance' || o.def.crowd)) { if (++n >= 2) return true; } }
    return false;
  };
})();

/* ---------------- projectiles + shockwaves ---------------- */
class BurnsProjectiles {
  constructor(g) { this.g = g; this.list = []; this.waves = []; }
  add(o) { const p = Object.assign({ vx: 0, vy: 0, vz: 0, life: 4, t: 0, r: 0.4, dmg: 1, dead: false }, o); if (Array.isArray(p.text)) p.text = p.text[Math.floor(Math.random() * p.text.length)];   /* text: one line, or a list to pick from */ if (p.speed && !o.vx && !o.vz) { const pl = this.g.player, dx = pl.x - p.x, dz = pl.z - p.z, dy = pl.y + 1.1 - p.y, d = Math.hypot(dx, dy, dz) || 1; p.vx = dx / d * p.speed; p.vy = dy / d * p.speed; p.vz = dz / d * p.speed; } this.list.push(p); return p; }
  wave(o) { const w = Object.assign({ r: 0.5, speed: 8, max: 10, h: 0.6, w: 0.8, dmg: 1, col: '#ff5a3a', hitDone: false }, o); w.y = w.y || this.g.world.height(w.x, w.z); w.c = burnsRGBf(w.col); this.waves.push(w); return w; }
  update(dt) {
    const g = this.g, p = g.player, W = g.world;
    for (const q of this.list) {
      if (q.dead) continue;
      q.t += dt; if (q.t > q.life) { q.dead = true; if (q.kind === 'firework') this.explode(q); continue; }
      if (q.kind === 'pitch' && q.homing) {
        const dx = p.x - q.x, dy = p.y + 1.1 - q.y, dz = p.z - q.z, d = Math.hypot(dx, dy, dz) || 1, sp = Math.hypot(q.vx, q.vy, q.vz);
        q.vx = BurnsM.damp(q.vx, dx / d * sp, q.homing, dt); q.vy = BurnsM.damp(q.vy, dy / d * sp, q.homing, dt); q.vz = BurnsM.damp(q.vz, dz / d * sp, q.homing, dt);
      }
      if (q.gravity) q.vy -= q.gravity * dt;
      q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt;
      const gy = W.height(q.x, q.z);
      if (q.kind === 'puke') {
        // bouncing puke balls thrown by Brady
        const s = W.surface(q.x, q.z, q.y + 0.3, 0.1, BURNS_SURF);
        if (q.y - q.r < s.y) { q.y = s.y + q.r; q.vy = Math.abs(q.vy) * 0.62; q.bounces = (q.bounces || 0) + 1; g.fx.puke(q.x, q.y, q.z, 3); if (q.bounces > 4) q.dead = true; }
        if (W.push(q, q.r, q.y - q.r, q.r * 2, 0)) { q.vx *= -0.6; q.vz *= -0.6; }
        for (const a of g.actors) { if (a.defeated || a.friendly || a.hidden) continue; if (Math.hypot(a.x - q.x, a.z - q.z) < a.r + q.r + 0.2 && q.y > a.y && q.y < a.y + a.h + 0.3) { a.hit('puke', q.x, q.z); q.dead = true; g.fx.puke(q.x, q.y, q.z, 10); break; } }
        if (g.bossHit(q.x, q.y, q.z, q.r + 0.3, 'puke')) { q.dead = true; g.fx.puke(q.x, q.y, q.z, 10); }
        continue;
      }
      if (q.kind === 'firework') {
        if (q.vy < 0 && q.y <= gy + 0.3) { q.dead = true; this.explode(q); }
        if (Math.random() < 0.7) g.fx.trail(q.x, q.y, q.z, q.col || '#ffd84a');
        continue;
      }
      if (q.kind === 'fireball') {
        const s = W.surface(q.x, q.z, q.y + 0.5, 0.1, BURNS_SURF);
        if (q.y < s.y + 0.4) { q.y = s.y + 0.4; q.vy = 0; }
        if (Math.random() < 0.9) g.fx.fire(q.x, q.y, q.z, 0.9);
        if (q.trail && Math.random() < dt * 8) g.addTempFire(q.x, s.y, q.z, 0.9, q.trail);
      }
      if (q.y < gy - 0.5) { q.dead = true; continue; }
      // hit the player
      const dx = p.x - q.x, dz = p.z - q.z, dy = (p.y + p.h * 0.5) - q.y;
      if (Math.hypot(dx, dz) < q.r + p.r && Math.abs(dy) < p.h * 0.5 + q.r) {
        if (q.kind === 'pitch' && p.spinT > 0) { q.dead = true; g.fx.burst(q.x, q.y, q.z, 'star', 10, '#38f2ff'); burnsSfx('pick', { vol: 0.5 }); g.toast('PITCH DECLINED!'); continue; }
        q.dead = true; p.hurt(q.dmg, q.x, q.z, 4); g.fx.burst(q.x, q.y, q.z, 'spark', 10, q.kind === 'pitch' ? '#38f2ff' : '#ff7a2a');
      }
      // spin pops pitches in range
      if (q.kind === 'pitch' && p.spinT > 0 && Math.hypot(dx, dz) < 1.9 && Math.abs(dy) < 1.5) { q.dead = true; g.fx.burst(q.x, q.y, q.z, 'star', 10, '#38f2ff'); burnsSfx('pick', { vol: 0.5 }); }
    }
    this.list = this.list.filter(q => !q.dead);
    for (const w of this.waves) {
      const prev = w.r; w.r += w.speed * dt;
      if (w.r > w.max) { w.dead = true; continue; }
      if (w.hitDone || p.invT > 0) continue;
      const d = Math.hypot(p.x - w.x, p.z - w.z);
      const crossed = (d >= prev - w.w * 0.5 && d <= w.r + w.w * 0.5);
      if (crossed && p.y < w.y + w.h && p.grounded !== false) { w.hitDone = true; p.hurt(w.dmg, w.x, w.z, 7); }
      else if (crossed && p.y < w.y + w.h * 0.6) { w.hitDone = true; p.hurt(w.dmg, w.x, w.z, 7); }
    }
    this.waves = this.waves.filter(w => !w.dead);
  }
  explode(q) {
    const g = this.g, p = g.player;
    g.fx.firework(q.x, Math.max(q.y, g.world.height(q.x, q.z) + 0.5), q.z, q.col || BURNS_NEON[Math.floor(Math.random() * 7)]);
    burnsSfx('firework_burst', { vol: 0.7 });
    if (Math.hypot(p.x - q.x, p.z - q.z) < (q.blast || 2.6) && p.y < q.y + 2.5) p.hurt(q.dmg || 1, q.x, q.z, 7);
    g.shake(0.2);
  }
  draw(R) {
    const g = this.g, S = BURNS_SPRITES.R;
    for (const q of this.list) {
      if (q.kind === 'pitch') { const pul = 1 + Math.sin(q.t * 9) * 0.06; R.bbs.bb(q.x, q.y, q.z, 1.3 * pul, 1.3 * pul, S.bubble, [0.75, 0.95, 1], 0.9, false); R.bbs.bb(q.x, q.y, q.z, 2.2, 2.2, S.glow, [0.2, 0.8, 1], 0.5, true); }
      else if (q.kind === 'puke') { R.bbs.bb(q.x, q.y, q.z, q.r * 2.4, q.r * 2.4, S.dot, [0.45, 0.95, 0.25], 1, false); R.bbs.bb(q.x, q.y, q.z, q.r * 4, q.r * 4, S.glow, [0.3, 0.8, 0.1], 0.5, true); }
      else if (q.kind === 'firework') { R.bbs.bb(q.x, q.y, q.z, 1.2, 1.2, S.glow, burnsRGBf(q.col || '#ffd84a'), 1, true); }
      else if (q.kind === 'fireball') { R.bbs.bb(q.x, q.y, q.z, 1.8, 2.2, S.flame, [1, 0.6, 0.2], 1, true); }
      else R.bbs.bb(q.x, q.y, q.z, 1, 1, S.glow, [1, 0.6, 0.3], 1, true);
      if (q.mark) R.flat.flat(q.mark.x, q.mark.y + 0.05, q.mark.z, 3.2, 3.2, 0, S.warn, [1, 0.2, 0.2], 0.8, true);
    }
    for (const w of this.waves) {
      const fade = 1 - w.r / w.max;
      R.flat.flat(w.x, w.y + 0.12, w.z, w.r * 2.15, w.r * 2.15, 0, S.ring, w.c, 0.9 * fade + 0.1, true);
      R.flat.flat(w.x, w.y + 0.1, w.z, w.r * 2.0, w.r * 2.0, 0, S.ring, w.c, 0.5 * fade, true);
      if (w.dust && Math.random() < 0.5) { const a = Math.random() * TAU; g.fx.dust(w.x + Math.cos(a) * w.r, w.y + 0.1, w.z + Math.sin(a) * w.r, 1); }
    }
    // warning markers for incoming fireworks
    for (const q of this.list) if (q.kind === 'firework' && q.tx !== undefined) R.flat.flat(q.tx, g.world.height(q.tx, q.tz) + 0.06, q.tz, 4.5, 4.5, q.t * 3, S.warn, [1, 0.25, 0.2], 0.55 + Math.sin(q.t * 18) * 0.35, true);
  }
}

/* ---------------- particles ---------------- */
class BurnsFX {
  constructor(max) {
    this.max = max || 2600; this.n = 0;
    const N = this.max;
    this.p = new Float32Array(N * 16); // x y z vx vy vz life max size size1 r g b a rot vrot
    this.k = new Uint8Array(N);        // sprite kind index
    this.f = new Uint8Array(N);        // flags: 1 additive, 2 gravity, 4 drag, 8 flat, 16 streak, 32 float up
    this.kinds = ['glow', 'spark', 'puff', 'flame', 'heart', 'square', 'star', 'z', 'smoke', 'streak', 'ring', 'dot', 'drop', 'note'];
    this.kIdx = {}; this.kinds.forEach((k, i) => this.kIdx[k] = i);
    this.flashes = [];
  }
  add(x, y, z, vx, vy, vz, life, s0, s1, col, a, kind, flags, rot, vrot) {
    if (this.n >= this.max) return;
    const i = this.n++, o = i * 16, P = this.p;
    P[o] = x; P[o + 1] = y; P[o + 2] = z; P[o + 3] = vx; P[o + 4] = vy; P[o + 5] = vz; P[o + 6] = life; P[o + 7] = life; P[o + 8] = s0; P[o + 9] = s1;
    P[o + 10] = col[0]; P[o + 11] = col[1]; P[o + 12] = col[2]; P[o + 13] = a; P[o + 14] = rot || 0; P[o + 15] = vrot || 0;
    this.k[i] = this.kIdx[kind] || 0; this.f[i] = flags;
  }
  update(dt) {
    const P = this.p, F = this.f;
    let w = 0;
    for (let i = 0; i < this.n; i++) {
      const o = i * 16;
      P[o + 6] -= dt;
      if (P[o + 6] <= 0) continue;
      const fl = F[i];
      if (fl & 2) P[o + 4] -= 14 * dt;
      if (fl & 32) P[o + 4] += 1.5 * dt;
      if (fl & 4) { const k = Math.exp(-2.2 * dt); P[o + 3] *= k; P[o + 4] *= k; P[o + 5] *= k; }
      P[o] += P[o + 3] * dt; P[o + 1] += P[o + 4] * dt; P[o + 2] += P[o + 5] * dt; P[o + 14] += P[o + 15] * dt;
      if (w !== i) { P.copyWithin(w * 16, o, o + 16); this.k[w] = this.k[i]; F[w] = F[i]; }
      w++;
    }
    this.n = w;
    for (const f of this.flashes) f.t -= dt;
    this.flashes = this.flashes.filter(f => f.t > 0);
  }
  draw(R) {
    const P = this.p, S = BURNS_SPRITES.R, regs = this.kinds.map(k => S[k] || S.glow);
    const col = [0, 0, 0];
    for (let i = 0; i < this.n; i++) {
      const o = i * 16, life = P[o + 6], max = P[o + 7], t = 1 - life / max, fl = this.f[i];
      const size = lerp(P[o + 8], P[o + 9], t);
      const fade = Math.min(1, life / Math.min(0.35, max * 0.5)) * Math.min(1, t * 8 + 0.2);
      col[0] = P[o + 10]; col[1] = P[o + 11]; col[2] = P[o + 12];
      const a = P[o + 13] * fade;
      if (fl & 8) R.flat.flat(P[o], P[o + 1], P[o + 2], size, size, P[o + 14], regs[this.k[i]], col, a, !!(fl & 1));
      else if (fl & 16) R.bbs.streak(P[o], P[o + 1], P[o + 2], P[o + 3], P[o + 4], P[o + 5], size * 3, size * 0.5, regs[this.k[i]], col, a);
      else R.bbs.bb(P[o], P[o + 1], P[o + 2], size, size, regs[this.k[i]], col, a, !!(fl & 1), P[o + 14]);
    }
    for (const f of this.flashes) R.bbs.bb(f.x, f.y, f.z, 6 * f.t / 0.25, 6 * f.t / 0.25, S.glow, [1, 1, 1], 1, true);
  }
  /* ---- presets ---- */
  dust(x, y, z, n, col) { const c = burnsRGBf(col || '#d8b896'); for (let i = 0; i < n; i++) this.add(x + (Math.random() - 0.5) * 0.6, y + Math.random() * 0.3, z + (Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 2.2, 0.4 + Math.random() * 1.2, (Math.random() - 0.5) * 2.2, 0.8 + Math.random() * 0.8, 0.6, 2.2 + Math.random(), c, 0.42, 'puff', 4, Math.random() * 6, (Math.random() - 0.5)); }
  burst(x, y, z, kind, n, col) { const c = burnsRGBf(col || '#ffffff'); for (let i = 0; i < n; i++) { const a = Math.random() * TAU, e = Math.random() * 2 - 0.5, sp = 2 + Math.random() * 4; this.add(x, y, z, Math.cos(a) * sp, e * sp + 1.5, Math.sin(a) * sp, 0.5 + Math.random() * 0.4, 0.5, 0.15, c, 1, kind || 'spark', 1 | 4, Math.random() * 6, 4); } }
  spark(x, y, z, n, col, sp) { const c = burnsRGBf(col || '#ffb040'); for (let i = 0; i < n; i++) { const a = Math.random() * TAU, e = Math.random(), s = (sp || 6) * (0.4 + Math.random() * 0.6); this.add(x, y, z, Math.cos(a) * s * (1 - e * 0.5), e * s + 1, Math.sin(a) * s * (1 - e * 0.5), 0.5 + Math.random() * 0.5, 0.28, 0.08, c, 1, 'streak', 1 | 2 | 16); } }
  fire(x, y, z, s) { s = s || 1; this.add(x + (Math.random() - 0.5) * 0.3 * s, y + Math.random() * 0.2, z + (Math.random() - 0.5) * 0.3 * s, (Math.random() - 0.5) * 0.4, 1.8 + Math.random() * 1.6, (Math.random() - 0.5) * 0.4, 0.45 + Math.random() * 0.3, 0.9 * s, 0.25 * s, [1, 0.55 + Math.random() * 0.3, 0.2], 1, 'flame', 1, (Math.random() - 0.5) * 0.6, 0); if (Math.random() < 0.25) this.add(x, y + 0.6 * s, z, (Math.random() - 0.5) * 1.2, 2.4 + Math.random() * 2, (Math.random() - 0.5) * 1.2, 0.8 + Math.random() * 0.6, 0.09, 0.03, [1, 0.7, 0.3], 1, 'spark', 1 | 4); if (Math.random() < 0.08) this.add(x, y + 1.0 * s, z, 0, 1.2, 0, 1.6, 0.6 * s, 2.2 * s, [0.18, 0.15, 0.16], 0.35, 'smoke', 4); }
  confetti(x, y, z, n) { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, sp = 2 + Math.random() * 4; this.add(x, y, z, Math.cos(a) * sp, 3 + Math.random() * 5, Math.sin(a) * sp, 1.6 + Math.random() * 1.2, 0.22, 0.2, burnsRGBf(BURNS_NEON[i % 7]), 1, 'square', 2 | 4, Math.random() * 6, (Math.random() - 0.5) * 14); } }
  hearts(x, y, z, n) { for (let i = 0; i < n; i++) this.add(x + (Math.random() - 0.5) * 0.8, y, z + (Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 1.2, 1.4 + Math.random() * 1.2, (Math.random() - 0.5) * 1.2, 1.2 + Math.random() * 0.6, 0.45, 0.3, [1, 0.35, 0.65], 1, 'heart', 1 | 4); }
  zzz(x, y, z) { this.add(x, y, z, 0.3, 0.6, 0.1, 2.2, 0.25, 0.6, [0.8, 0.85, 1], 0.9, 'z', 0, (Math.random() - 0.5) * 0.5, 0); }
  glint(x, y, z, col) { this.add(x + (Math.random() - 0.5) * 0.5, y + (Math.random() - 0.5) * 0.5, z + (Math.random() - 0.5) * 0.5, 0, 0.3, 0, 0.6, 0.5, 0.05, burnsRGBf(col || '#fff8d0'), 1, 'star', 1, Math.random() * 3, 3); }
  firework(x, y, z, col) { const c = burnsRGBf(col || '#ff4fd8'), c2 = burnsRGBf(BURNS_NEON[Math.floor(Math.random() * 7)]); for (let i = 0; i < 46; i++) { const u = Math.random() * 2 - 1, a = Math.random() * TAU, s = Math.sqrt(1 - u * u), sp = 7 + Math.random() * 3; this.add(x, y, z, Math.cos(a) * s * sp, u * sp, Math.sin(a) * s * sp, 0.9 + Math.random() * 0.5, 0.35, 0.1, i % 3 ? c : c2, 1, 'streak', 1 | 2 | 4 | 16); } this.add(x, y, z, 0, 0, 0, 0.3, 5, 9, c, 1, 'glow', 1); }
  trail(x, y, z, col) { this.add(x, y, z, (Math.random() - 0.5) * 0.5, -0.5, (Math.random() - 0.5) * 0.5, 0.45, 0.4, 0.05, burnsRGBf(col || '#ffd84a'), 1, 'glow', 1); }
  puke(x, y, z, n) { for (let i = 0; i < n; i++) this.add(x, y, z, (Math.random() - 0.5) * 4, 1 + Math.random() * 3, (Math.random() - 0.5) * 4, 0.6, 0.3, 0.1, [0.5, 0.95, 0.25], 1, 'dot', 2); }
  ring(x, y, z, r, col, life) { this.add(x, y, z, 0, 0, 0, life || 0.5, r * 0.3, r * 2, burnsRGBf(col || '#ffffff'), 1, 'ring', 1 | 8); }
  smoke(x, y, z, n, col) { const c = burnsRGBf(col || '#e8e8f0'); for (let i = 0; i < n; i++) this.add(x + (Math.random() - 0.5) * 0.4, y, z + (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.8, 0.6 + Math.random() * 0.8, (Math.random() - 0.5) * 0.8, 1.4 + Math.random() * 0.8, 0.5, 1.8, c, 0.4, 'smoke', 4); }
  notes(x, y, z) { this.add(x + (Math.random() - 0.5), y, z + (Math.random() - 0.5), (Math.random() - 0.5) * 0.6, 1.2, (Math.random() - 0.5) * 0.6, 1.4, 0.35, 0.3, burnsRGBf(BURNS_NEON[Math.floor(Math.random() * 7)]), 1, 'note', 1); }
  flashAt(x, y, z) { this.flashes.push({ x, y, z, t: 0.25 }); }
}

/* ---------------- pickups ---------------- */
const BURNS_PICKUP_MESH = {
  glowstick(m, o) { const c = o.col || BURNS_NEON[(o.seed || 0) % 7]; m.push(); m.tf(0, 0, 0, 0, 0, 0.5); m.color(c, 1); m.cyl(0, -0.26, 0, 0.055, 0.055, 0.52, 6, {}); m.color('#2a2a2a', 0); m.cyl(0, 0.24, 0, 0.06, 0.06, 0.06, 6, {}); m.pop(); m.emissive(0); },
  water(m) { m.color('#9adcff', 0.25); m.cyl(0, -0.2, 0, 0.11, 0.11, 0.34, 8, {}); m.cyl(0, 0.14, 0, 0.11, 0.05, 0.08, 8, {}); m.color('#2a6aff', 0.2); m.cyl(0, 0.22, 0, 0.05, 0.05, 0.06, 8, {}); m.color('#ffffff', 0); m.cyl(0, -0.08, 0, 0.113, 0.113, 0.1, 8, { caps: false }); m.emissive(0); },
  bag(m, o) { const P = BURNS_POWERUPS[o.power] || BURNS_POWERUPS.water; m.color('#e8eef8', 0.12); m.bbox(0, 0, 0, 0.44, 0.52, 0.08, 0.025); m.color(P.col, 0.5); m.box(0, 0.23, 0, 0.45, 0.05, 0.09); m.emissive(0.3); m.color('#ffffff'); const reg = BURNS_ATLAS.icon(P.icon); m.decal(0, -0.03, 0.042, 0.3, 0.3, reg); m.push(); m.tf(0, 0, 0, Math.PI); m.decal(0, -0.03, 0.042, 0.3, 0.3, reg); m.pop(); m.emissive(0); },
  token(m) { m.push(); m.tf(0, 0, 0, 0, Math.PI / 2, 0); m.color('#ffb020', 0.35); m.cyl(0, -0.06, 0, 0.48, 0.48, 0.12, 16, { top: '#ffd860' }); m.color('#c87010', 0.2); m.cyl(0, -0.065, 0, 0.5, 0.5, 0.13, 16, { caps: false }); m.pop(); m.color('#ffc040', 0.5); const reg = BURNS_ATLAS.icon('token'); m.decal(0, 0, 0.066, 0.66, 0.66, reg); m.push(); m.tf(0, 0, 0, Math.PI); m.decal(0, 0, 0.066, 0.66, 0.66, reg); m.pop(); m.emissive(0); },
  photo(m) { m.color('#f8f4ec', 0.3); m.box(0, 0, 0, 0.5, 0.62, 0.025); m.color('#ffffff', 0.4); const reg = BURNS_ATLAS.regions.photo; m.decal(0, 0, 0.014, 0.48, 0.6, reg); m.push(); m.tf(0, 0, 0, Math.PI); m.decal(0, 0, 0.014, 0.48, 0.6, reg); m.pop(); m.emissive(0); },
  item(m, o) { const icon = o.icon || o.item || 'ticket'; const col = o.col || (BURNS_KEY_ITEMS[o.item] ? BURNS_KEY_ITEMS[o.item].col : '#f4f0e8'); m.color(col, 0.3); m.bbox(0, 0, 0, 0.62, 0.62, 0.06, 0.02); m.color(col, 0.45); const reg = BURNS_ATLAS.icon(icon) || BURNS_ATLAS.icon('ticket'); m.decal(0, 0, 0.032, 0.56, 0.56, reg); m.push(); m.tf(0, 0, 0, Math.PI); m.decal(0, 0, 0.032, 0.56, 0.56, reg); m.pop(); m.emissive(0); }
};
class BurnsPickups {
  constructor(g, defs) {
    this.g = g; this.items = []; this.groups = [];
    let grp = null;
    const add = (d) => {
      if (!grp || grp.full) { grp = new BurnsGroup(); grp.pickups = true; this.groups.push(grp); }
      const kind = d.kind, k = kind.split(':');
      const P = Object.assign({}, d, { base: k[0], arg: k[1], taken: false, t: Math.random() * 6, y0: d.y });
      // ground scores (bag:<power>) only exist once the story flag is set (world 16); they go to the backpack
      P.score = P.base === 'bag' && BurnsPack.isScore(P.arg);
      const PK = P.base === 'pack' ? BurnsPack.get(P.arg) : null;
      const meshKind = P.base === 'glowstick' ? 'glowstick' : P.base === 'water' ? 'water' : P.base === 'bag' ? 'bag' : P.base === 'token' ? 'token' : P.base === 'photo' ? 'photo' : 'item';
      P.obj = grp.add(m => { BURNS_PICKUP_MESH[meshKind](m, { col: d.col || (PK && PK.col), seed: this.items.length, power: P.arg, icon: d.icon || (PK && PK.icon) || P.arg, item: P.arg }); return {}; });
      P.glowCol = burnsRGBf(P.base === 'glowstick' ? (d.col || BURNS_NEON[this.items.length % 7]) : P.base === 'token' ? '#ffc040' : P.base === 'bag' ? (BURNS_POWERUPS[P.arg] || BURNS_POWERUPS.water).col : P.base === 'water' ? '#5ad0ff' : P.base === 'photo' ? '#ff9ad0' : PK ? (d.col || PK.col || '#ffe080') : '#ffe080');
      P.label = P.base === 'bag' ? (BURNS_POWERUPS[P.arg] || {}).label : P.base === 'item' ? (BURNS_KEY_ITEMS[P.arg] ? BURNS_KEY_ITEMS[P.arg].name : (d.label || '')) : PK ? (d.label || PK.name) : d.label || null;
      this.items.push(P);
      return P;
    };
    // persistent collectibles that were already taken stay gone
    for (const d of defs) {
      const base = d.kind.split(':')[0];
      if (base === 'token' && d.mission && BurnsSave.hasToken(g.worldId, d.mission)) continue;
      if (base === 'photo' && BurnsSave.hasPhoto(g.worldId, d.id)) continue;
      if (base === 'item' && d.persist !== false && BurnsSave.hasItem(d.kind.split(':')[1]) && !d.mission) continue;
      add(d);
    }
    // spare slots for pickups spawned at runtime (tokens, drops)
    this.spare = [];
    const spareKinds = ['token', 'token', 'token', 'water', 'water'].concat(new Array(40).fill('glowstick'));
    for (const k of spareKinds) { const P = add({ kind: k, x: 0, y: -50, z: 0, spare: true }); P.taken = true; P.obj.visible = false; this.spare.push(P); }
    for (const G of this.groups) G.finish();
  }
  spawn(kind, x, y, z, o) {
    o = o || {};
    const base = kind.split(':')[0], arg = kind.split(':')[1];
    const P = this.spare.find(s => s.taken && s.base === base);
    if (!P) {
      if (base === 'glowstick') { this.g.addGlow(1); }
      // runtime baggies / backpack items have no spare slot: they go straight into the backpack
      else if (base === 'pack' && arg) this.g.pack.add(arg);
      else if (base === 'bag' && arg) { if (!BurnsPack.isScore(arg)) this.g.player.givePower('water'); else if (BurnsSave.groundScore()) this.g.pack.add(arg); }
      return null;
    }
    Object.assign(P, { x, y, z, y0: y, taken: false, mission: o.mission, id: o.id, pop: o.pop ? 0.6 : 0, vy: o.pop ? 5 : 0, t: 0, label: o.label || P.label, onTake: o.onTake });
    P.obj.visible = true;
    return P;
  }
  update(dt) {
    const g = this.g, p = g.player, rad = (p.giant > 0 ? 2.6 : 1.1);
    const gs = g.gsOn = BurnsSave.groundScore();
    for (const P of this.items) {
      if (P.taken || (P.score && !gs)) continue;
      P.t += dt;
      if (P.pop > 0) { P.pop -= dt; P.vy -= 18 * dt; P.y0 += P.vy * dt; const s = g.world.surface(P.x, P.z, P.y0, 0.1, BURNS_SURF).y + 0.7; if (P.y0 < s) { P.y0 = s; P.vy = Math.abs(P.vy) * 0.4; } }
      if (P.hidden && !(p.power === 'lsd' && p.powerT > 0)) continue;
      if (P.gate && g.missions.state(P.mission) !== 'active') continue;
      if (P.follow) P.follow(g, P);
      const dx = p.x - P.x, dz = p.z - P.z, dy = (p.y + 0.9) - P.y0;
      if (dx * dx + dz * dz < rad * rad && Math.abs(dy) < 1.4 + (p.giant > 0 ? 2 : 0)) { P.taken = true; P.obj.visible = false; g.onPickup(P); }
      else if (P.base === 'glowstick' && p.magnetT > 0 && dx * dx + dz * dz < 36) { P.x += dx * dt * 4; P.z += dz * dt * 4; }
    }
  }
  draw(R) {
    const p = this.g.player, S = BURNS_SPRITES.R, lsd = p.power === 'lsd' && p.powerT > 0, cam = R.cam;
    for (const P of this.items) {
      const o = P.obj;
      if (P.taken || (P.score && !this.g.gsOn) || (P.hidden && !lsd) || (P.gate && this.g.missions.state(P.mission) !== 'active')) { o.visible = false; continue; }
      o.visible = true;
      const spin = P.base === 'glowstick' ? P.t * 2.2 : P.t * 1.8, bob = Math.sin(P.t * 2.4) * 0.12;
      o.x = P.x; o.y = P.y0 + bob; o.z = P.z; o.yaw = spin; o.scale = P.base === 'token' ? 1.15 : P.base === 'photo' ? 1.2 : 1;
      if (P.hidden) o.scale *= 0.9 + Math.sin(P.t * 8) * 0.1;
      const d2 = (cam.x - P.x) * (cam.x - P.x) + (cam.z - P.z) * (cam.z - P.z);
      if (d2 > 140 * 140) continue;
      const gs = P.base === 'glowstick' ? 1.1 : P.base === 'token' ? 3.0 : 1.9;
      R.bbs.bb(P.x, o.y, P.z, gs, gs, S.glow, P.glowCol, P.base === 'glowstick' ? 0.75 : 0.85, true);
      if (P.base === 'token' && Math.random() < 0.3) this.g.fx.glint(P.x, o.y, P.z, '#ffe080');
      if (d2 < 60 * 60) { const gy = this.g.world.surface(P.x, P.z, P.y0, 0.1, BURNS_SURF).y; R.flat.flat(P.x, gy + 0.03, P.z, 0.7, 0.7, 0, S.shadow, [0, 0, 0], 0.35, false); }
    }
    for (const G of this.groups) G.pose();
  }
}

/* ---------------- the Man: reusable boss controller ----------------
   cfg: { x, z, yaw, scale (1 = ~13m), hp, name, title,
          attacks: ['stomp','swipe','flash','fire','fireworks'],   (enabled set)
          phases: [{ hp: fraction at which it starts, attacks:[...], rate: speed mult, combo: attacks before a stun }],
          stun: seconds vulnerable, holdChinka: bool, arena: {x,z,r},
          onPhase(game, boss, i), onHit(game, boss), onDefeat(game, boss) } */
class BurnsManBoss {
  constructor(g, cfg) {
    this.g = g; this.cfg = Object.assign({ hp: 6, scale: 0.8, attacks: ['stomp', 'swipe', 'flash'], stun: 5, combo: 3, holdChinka: true, name: 'THE MAN', title: 'Lovesick Effigy' }, cfg);
    this.model = BurnsManModel.build();
    this.ch = new BurnsChar(this.model); this.ch.rim = 0.2;
    this.x = cfg.x; this.z = cfg.z; this.y = cfg.y || 0; this.yaw = cfg.yaw || 0; this.scale = this.cfg.scale;
    this.hp = this.cfg.hp; this.maxHp = this.hp;
    this.st = 'idle'; this.stT = 0; this.t = 0; this.atk = null; this.combo = 0; this.phase = 0;
    this.active = false; this.defeated = false; this.name = this.cfg.name; this.title = this.cfg.title;
    this.ch.poseFn = (P, t) => this.pose(P, t);
    this.flashK = 0; this.headGlow = 0; this.beam = null; this.lean = 0;
    this.cols = [{ t: 'cyl', r: 1.1, y0: 0, y1: 6, cover: false }, { t: 'cyl', r: 1.1, y0: 0, y1: 6, cover: false }];
    if (this.cfg.holdChinka) { this.chinka = new BurnsChar(BurnsRig.model(BurnsRig.chinkaSpec())); this.chinka.play('captive'); }
    this.ch.x = this.x; this.ch.z = this.z; this.ch.yaw = this.yaw; this.ch.scale = this.scale; this.ch.update(0); this.ch.compute();
  }
  get phaseCfg() { const P = this.cfg.phases; if (!P || !P.length) return { attacks: this.cfg.attacks, rate: 1, combo: this.cfg.combo }; return P[Math.min(this.phase, P.length - 1)]; }
  start() { this.active = true; this.st = 'idle'; this.stT = 0; }
  // body-part positions (after compute)
  head(out) { return this.ch.bonePoint(BURNS_BONES.HEAD, 0, 1.9, 0, out || [0, 0, 0]); }
  hand(side, out) { return this.ch.bonePoint(side > 0 ? BURNS_BONES.FARM_L : BURNS_BONES.FARM_R, 0, -3.0, 0, out || [0, 0, 0]); }
  foot(side, out) { return this.ch.bonePoint(side > 0 ? BURNS_BONES.FOOT_L : BURNS_BONES.FOOT_R, 0, -0.3, 0.4, out || [0, 0, 0]); }
  pose(P, t) {
    const B = BURNS_BONES, S = (b, x, y, z) => { P.r[b * 3] = x; P.r[b * 3 + 1] = y || 0; P.r[b * 3 + 2] = z || 0; };
    const st = this.st, u = this.stT, sw = Math.sin(t * 1.3);
    // default: arms raised in a V, gentle lovesick sway
    S(B.UARM_L, -0.25, 0, 2.55 + sw * 0.06); S(B.FARM_L, 0, 0, 0.25); S(B.UARM_R, -0.25, 0, -2.55 - sw * 0.06); S(B.FARM_R, 0, 0, -0.25);
    S(B.CHEST, 0.02, sw * 0.05, sw * 0.03); S(B.HEAD, -0.05, sw * 0.12, -sw * 0.08); P.y = 0;
    if (this.chinka) { S(B.UARM_L, -0.6, 0, 1.9); S(B.FARM_L, -0.9, 0, 0.3); }
    if (st === 'stomp') {
      const lift = u < 0.9 ? easeOut(u / 0.9) : u < 1.05 ? 1 - (u - 0.9) / 0.15 : 0;
      S(B.THIGH_R, -1.1 * lift); S(B.SHIN_R, 1.3 * lift); S(B.CHEST, 0.05 - 0.15 * lift); S(B.HIPS, 0, 0, 0.08 * lift);
    } else if (st === 'swipe') {
      const k = clamp(u / 0.6, 0, 1), sweep = clamp((u - 0.6) / 1.5, 0, 1);
      S(B.UARM_R, -0.2, 0, lerp(-2.55, -1.15, k)); S(B.FARM_R, 0, 0, -0.1);
      S(B.CHEST, 0.25 * k, lerp(1.0, -1.0, easeInOut(sweep)) * k, 0); S(B.HEAD, 0.25 * k, 0, 0);
    } else if (st === 'flash') {
      const k = clamp(u / 0.5, 0, 1);
      S(B.UARM_L, -0.3, 0, 2.9); S(B.UARM_R, -0.3, 0, -2.9); S(B.CHEST, -0.2 * k); S(B.HEAD, -0.3 * k + Math.sin(t * 30) * 0.02 * this.flashK);
    } else if (st === 'fire') {
      const k = clamp(u / 0.5, 0, 1);
      S(B.CHEST, 0.45 * k); S(B.HEAD, 0.55 * k); S(B.UARM_L, -0.6, 0, 1.4); S(B.UARM_R, -0.6, 0, -1.4);
    } else if (st === 'fireworks') {
      const pump = Math.abs(Math.sin(u * 5));
      S(B.UARM_L, -0.1, 0, 2.8 + pump * 0.2); S(B.UARM_R, -0.1, 0, -2.8 - pump * 0.2); S(B.CHEST, -0.1); S(B.HEAD, -0.35);
    } else if (st === 'stunned') {
      const k = clamp(u / 0.6, 0, 1), wob = Math.sin(t * 3) * 0.05;
      S(B.THIGH_L, -1.25 * k); S(B.SHIN_L, 2.1 * k); S(B.THIGH_R, -1.25 * k); S(B.SHIN_R, 2.1 * k);
      S(B.CHEST, 1.15 * k + wob); S(B.HEAD, 0.3 * k);
      S(B.UARM_L, -1.2 * k, 0, 0.6); S(B.UARM_R, -1.2 * k, 0, -0.6); S(B.FARM_L, -0.3, 0, 0); S(B.FARM_R, -0.3, 0, 0);
      P.y = -4.4 * k;
    } else if (st === 'hurt') {
      const k = Math.max(0, 1 - u / 1.0);
      S(B.CHEST, -0.5 * k); S(B.HEAD, -0.6 * k + Math.sin(t * 25) * 0.1 * k); S(B.UARM_L, -0.5, 0, 2.0); S(B.UARM_R, -0.5, 0, -2.0);
      P.y = -2.0 * Math.max(0, 1 - u / 0.6);
    } else if (st === 'walk' || st === 'flee') {
      const ph = t * (st === 'flee' ? 5 : 2.6), s1 = Math.sin(ph);
      S(B.THIGH_L, -s1 * 0.45); S(B.SHIN_L, Math.max(0, s1) * 0.6); S(B.THIGH_R, s1 * 0.45); S(B.SHIN_R, Math.max(0, -s1) * 0.6);
      S(B.CHEST, 0.08, s1 * 0.08); S(B.HIPS, 0, -s1 * 0.06);
      if (st === 'flee') { S(B.UARM_L, -0.6, 0, 1.9); S(B.UARM_R, -0.9, 0, -2.8); S(B.CHEST, 0.3); P.face = 2; }
    } else if (st === 'grab') {
      const k = clamp(u / 0.8, 0, 1), back = clamp((u - 1.2) / 0.8, 0, 1), r = k * (1 - back);
      S(B.CHEST, 0.9 * r); S(B.HEAD, 0.4 * r); S(B.UARM_L, lerp(-0.25, -1.3, r), 0, lerp(2.55, 0.3, r)); S(B.FARM_L, -0.4 * r, 0, 0);
      S(B.THIGH_L, -0.7 * r); S(B.SHIN_L, 1.2 * r); S(B.THIGH_R, -0.7 * r); S(B.SHIN_R, 1.2 * r); P.y = -1.6 * r;
    } else if (st === 'defeated') {
      const k = clamp(u / 1.2, 0, 1);
      S(B.THIGH_L, -1.0 * k); S(B.SHIN_L, 1.8 * k); S(B.THIGH_R, -0.6 * k); S(B.SHIN_R, 1.4 * k); S(B.CHEST, 0.6 * k); S(B.HEAD, 0.4 * k);
      P.y = -3.0 * k;
    }
    P.face = this.st === 'hurt' || this.st === 'stunned' || this.st === 'flee' ? 2 : (this.st === 'idle' || this.st === 'walk' || this.st === 'grab') ? 3 : 0;
  }
  pickAttack() {
    const list = (this.phaseCfg.attacks || this.cfg.attacks).filter(a => this.cfg.attacks.indexOf(a) >= 0 || (this.phaseCfg.attacks || []).indexOf(a) >= 0);
    let a = list[Math.floor(Math.random() * list.length)];
    if (list.length > 1 && a === this.lastAtk) a = list[(list.indexOf(a) + 1) % list.length];
    this.lastAtk = a;
    return a || 'stomp';
  }
  setState(st) { this.st = st; this.stT = 0; this.fired = 0; }
  update(dt) {
    const g = this.g, p = g.player, rate = (this.phaseCfg.rate || 1);
    this.t += dt; this.stT += dt * (this.st === 'stunned' || this.st === 'hurt' || this.st === 'defeated' ? 1 : rate);
    const u = this.stT;
    const A = this.cfg.arena, away = A && Math.hypot(p.x - A.x, p.z - A.z) > A.r + 6;
    if (this.active && !this.defeated && away && this.st === 'idle') { this.stT = 0; }
    if (this.active && !this.defeated) {
      // slowly turn to face Brady
      if (this.st === 'idle' || this.st === 'fire' || this.st === 'flash') this.yaw = BurnsM.dampAngle(this.yaw, Math.atan2(p.x - this.x, p.z - this.z), 0.8, dt);
      if (this.st === 'idle') {
        if (u > (1.6 / rate)) {
          if (this.combo >= (this.phaseCfg.combo || this.cfg.combo)) { this.combo = 0; this.setState('stunned'); this.g.bossSay(this, this.cfg.stunLine || ['I... am... so... tired... of loving...', 'Need... to... sit...', 'Love is... exhausting...'][Math.floor(Math.random() * 3)]); burnsSfx('man_roar', { pitch: 0.6, vol: 0.6 }); }
          else { this.combo++; this.setState(this.pickAttack()); this.announce(); }
        }
      } else if (this.st === 'stomp') {
        if (u > 1.05 && !this.fired) { this.fired = 1; const f = this.foot(-1); g.shockwave({ x: f[0], z: f[2], y: this.y, speed: 10 * rate, max: (this.cfg.arena ? this.cfg.arena.r * 1.1 : 30), h: 0.75, w: 1.0, dmg: 1, col: '#ff6a3a', dust: true }); g.fx.dust(f[0], this.y + 0.2, f[2], 30); g.shake(0.6); burnsSfx('man_stomp'); }
        if (u > 1.9) this.setState('idle');
      } else if (this.st === 'swipe') {
        // a low neon whip sweeps the arena from the hand: jump over it
        if (u > 0.6 && u < 2.1) {
          const sweep = clamp((u - 0.6) / 1.5, 0, 1), ang = this.yaw + lerp(1.0, -1.0, easeInOut(sweep)) + 0.25;
          this.beam = { ang, len: this.cfg.arena ? this.cfg.arena.r * 1.3 : 36, h: 0.9 };
          const dx = p.x - this.x, dz = p.z - this.z, d = Math.hypot(dx, dz), pa = Math.atan2(dx, dz);
          if (d < this.beam.len && Math.abs(BurnsM.wrap(pa - ang)) < 0.06 + 1.2 / Math.max(2, d) && p.y < this.y + this.beam.h + 0.15) p.hurt(1, this.x, this.z, 8);
          if (!this.fired) { this.fired = 1; burnsSfx('neon_flash', { pitch: 1.6, vol: 0.5 }); }
        } else this.beam = null;
        if (u > 2.4) { this.beam = null; this.setState('idle'); }
      } else if (this.st === 'flash') {
        // neon flash: charge, then everything not behind cover gets wiped
        const charge = this.cfg.flashCharge || 2.6;
        this.flashK = clamp(u / charge, 0, 1);
        if (u < charge && Math.floor(u * 4) !== Math.floor((u - dt * rate) * 4)) burnsSfx('neon_flash', { pitch: 0.5 + this.flashK, vol: 0.25 });
        if (u >= charge && !this.fired) {
          this.fired = 1; this.flashK = 0;
          g.screenFlash('#fff4ff', 0.9); burnsSfx('neon_flash'); g.shake(0.4);
          const h = this.head();
          if (!g.world.covered(h[0], h[1], h[2], p.x, p.y + 1.0, p.z) && !g.world.covered(h[0], h[1], h[2], p.x, p.y + 0.3, p.z)) p.hurt(this.cfg.flashDamage || 2, this.x, this.z, 6, true);
          else g.toast('SAFE BEHIND COVER!');
        }
        if (u > charge + 0.9) this.setState('idle');
      } else if (this.st === 'fire') {
        if (u > 0.6 && u < 2.4 && Math.floor(u * 6) !== Math.floor((u - dt * rate) * 6)) {
          const h = this.head(), sp = 13, dx = p.x - h[0], dz = p.z - h[2], dy = p.y + 0.5 - h[1], d = Math.hypot(dx, dy, dz) || 1;
          g.projectile({ kind: 'fireball', x: h[0], y: h[1] - 0.5, z: h[2], vx: dx / d * sp + (Math.random() - 0.5) * 2, vy: dy / d * sp, vz: dz / d * sp + (Math.random() - 0.5) * 2, life: 3, r: 0.9, dmg: 1, trail: 2.5 });
          burnsSfx('flame_jet', { vol: 0.6 });
        }
        if (u > 2.8) this.setState('idle');
      } else if (this.st === 'fireworks') {
        const n = this.cfg.fireworks || 7;
        if (u > 0.4 && this.fired < n && u > 0.4 + this.fired * 0.28) {
          this.fired++;
          const hnd = this.hand(this.fired % 2 ? 1 : -1);
          const tx = p.x + (Math.random() - 0.5) * 9, tz = p.z + (Math.random() - 0.5) * 9, T = 1.8;
          const ty = g.world.height(tx, tz);
          g.projectile({ kind: 'firework', x: hnd[0], y: hnd[1], z: hnd[2], vx: (tx - hnd[0]) / T, vy: (ty - hnd[1]) / T + 0.5 * 16 * T, vz: (tz - hnd[2]) / T, gravity: 16, life: T + 0.3, dmg: 1, col: BURNS_NEON[this.fired % 7], tx, tz, blast: 2.7 });
          burnsSfx('firework_launch', { vol: 0.6 });
        }
        if (u > 0.6 + n * 0.28 + 1.4) this.setState('idle');
      } else if (this.st === 'stunned') {
        if (u > (this.cfg.stun || 5)) { this.setState('idle'); burnsSfx('man_roar', { vol: 0.5 }); }
      } else if (this.st === 'hurt') {
        if (u > 1.4) this.setState('idle');
      }
    }
    // pose + chinka in hand
    const ch = this.ch; ch.x = this.x; ch.y = this.y; ch.z = this.z; ch.yaw = this.yaw; ch.scale = this.scale;
    ch.update(dt); ch.compute();
    this.headGlow = BurnsM.damp(this.headGlow, this.st === 'flash' ? 1 + this.flashK * 2 : this.st === 'stunned' ? 0.3 : 1, 5, dt);
    if (this.chinka) {
      const hp = this.hand(1);
      const c = this.chinka; c.x = hp[0]; c.y = hp[1] - 0.9; c.z = hp[2]; c.yaw = this.yaw; c.update(dt); c.compute();
    }
    // leg colliders (dynamic) so Brady can't walk through him
    const fL = this.ch.bonePoint(BURNS_BONES.SHIN_L, 0, -1.2, 0), fR = this.ch.bonePoint(BURNS_BONES.SHIN_R, 0, -1.2, 0);
    this.cols[0].x = fL[0]; this.cols[0].z = fL[2]; this.cols[0].r = 0.75 * this.scale; this.cols[0].y1 = this.y + 4.5 * this.scale;
    this.cols[1].x = fR[0]; this.cols[1].z = fR[2]; this.cols[1].r = 0.75 * this.scale; this.cols[1].y1 = this.y + 4.5 * this.scale;
  }
  addColliders() { if (this.hidden || this.st === 'flee') return; for (const c of this.cols) { c.walk = false; c.solid = true; c.y0 = this.y; this.g.world.col.addDyn(c); } }
  announce() {
    const g = this.g, lines = {
      stomp: ['FEEL MY HEARTBEAT!', 'STOMP OF PASSION!'], swipe: ['LOW BLOW... OF LOVE!', 'JUMP, SMALL MAN!'],
      flash: ['BEHOLD MY GLOW! TAKE COVER!', 'NEON FLASH! HIDE, LITTLE BUN!'], fire: ['MY HEART IS ON FIRE!', 'HOT HOT LOVE!'], fireworks: ['FIREWORKS FOR MY BELOVED!', 'OOH! AAH!']
    };
    const L = lines[this.st]; if (L) g.bossSay(this, L[Math.floor(Math.random() * L.length)]);
    if (this.st === 'flash') g.warn('TAKE COVER!', this.cfg.flashCharge || 2.6);
  }
  // the player attacks: can only hurt him while he's stunned (head on the ground)
  hitTest(x, y, z, r, kind) {
    if (this.st !== 'stunned' || this.defeated) return false;
    const h = this.head(), dx = x - h[0], dy = y - h[1], dz = z - h[2], R = 1.6 * this.scale + r;
    if (dx * dx + dy * dy + dz * dz > R * R) return false;
    this.hurt(kind);
    return true;
  }
  hurt(kind) {
    const g = this.g;
    this.hp -= 1; g.shake(0.5); burnsSfx('bossHit'); burnsSfx('man_roar', { pitch: 1.3, vol: 0.7 });
    const h = this.head(); g.fx.burst(h[0], h[1], h[2], 'star', 20, '#ffe24a'); g.fx.hearts(h[0], h[1] + 1, h[2], 8);
    if (this.cfg.onHit) this.cfg.onHit(g, this);
    if (this.hp <= 0) { this.defeated = true; this.setState('defeated'); if (this.cfg.onDefeat) this.cfg.onDefeat(g, this); return; }
    // phase change
    const P = this.cfg.phases;
    if (P) { const frac = this.hp / this.maxHp; let ph = 0; P.forEach((q, i) => { if (frac <= q.hp) ph = i; }); if (ph !== this.phase) { this.phase = ph; if (this.cfg.onPhase) this.cfg.onPhase(g, this, ph); } }
    this.setState('hurt'); this.combo = 0;
    g.bossSay(this, ['OUCH! MY FEELINGS!', 'YOU DENT MY HEART!', 'SHE WILL NEVER LEAVE ME!', 'I WROTE HER A POEM!'][Math.floor(Math.random() * 4)]);
    // shake Brady off the head
    const p = g.player; const dx = p.x - h[0], dz = p.z - h[2], d = Math.hypot(dx, dz) || 1; p.knock(dx / d * 10, 9, dz / d * 10);
  }
  draw(R) {
    const S = BURNS_SPRITES.R, h = this.head(), glow = this.headGlow;
    if (this.st === 'flash' || this.st === 'stunned') R.bbs.bb(h[0],h[1],h[2],5*this.scale*glow,5*this.scale*glow,S.glow,[1,.72,.35],.22,true);
    if (this.st === 'flash' && this.flashK > 0) R.bbs.bb(h[0], h[1], h[2], 30 * this.flashK * this.scale, 30 * this.flashK * this.scale, S.glow, [1, 0.9, 1], 0.6 * this.flashK, true);
    if (this.beam) {
      const n = 44, c = Math.sin(this.beam.ang), s = Math.cos(this.beam.ang), y = this.y + this.beam.h * 0.7;
      for (let i = 2; i <= n; i++) { const d = i / n * this.beam.len, wob = Math.sin(this.t * 30 + i) * 0.15; R.bbs.bb(this.x + c * d, y + wob, this.z + s * d, 2.3, 2.3, S.glow, [0.3, 0.95, 1], 0.95, true); R.bbs.bb(this.x + c * d, y + wob, this.z + s * d, 0.8, 0.8, S.core, [0.85, 1, 1], 1, true); }
      R.flat.flat(this.x + c * this.beam.len / 2, this.y + 0.06, this.z + s * this.beam.len / 2, 2.6, this.beam.len, this.beam.ang, S.glow, [0.2, 0.8, 1], 0.7, true);
      if (Math.random() < 0.8) { const d = Math.random() * this.beam.len; this.g.fx.spark(this.x + c * d, y, this.z + s * d, 2, '#7af2ff', 4); }
    }
    if (this.st === 'stunned') { for (let i = 0; i < 3; i++) { const a = this.t * 3 + i * TAU / 3; R.bbs.bb(h[0] + Math.cos(a) * 1.8 * this.scale, h[1] + 1.8 * this.scale, h[2] + Math.sin(a) * 1.8 * this.scale, 0.9, 0.9, S.star, [1, 0.9, 0.3], 1, true); } }
    // shadow
    R.flat.flat(this.x, this.y + 0.04, this.z, 7 * this.scale, 7 * this.scale, 0, S.shadow, [0, 0, 0], 0.55, false);
  }
}

