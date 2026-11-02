/* ============================================================
   Story: intro panels, camp-boss messages from the little toads,
   and the ending where Brady finds Chinka as the Man burns.
   ============================================================ */
const STORY_BEATS = {
  '41-1': 'A little toad hops onto your boot: "Psst. The Man went that way, with Chinka on his shoulder. Toads hear everything on Gate Road."',
  '41-6': '"The Head Greeter lets you through at last. Chinka? The Man carried her into the city. Follow the smell of bad coffee."',
  '41-7': '"Kandi bracelets! One extra hit at the start of every level. Gifting is the whole point, man."',
  '42-4': '"The Head Camp Lead dropped her clipboard. It says: CHINKA, SEEN AT THE BIG TOP, 2 AM."',
  '42-6': '"Barista Bot sputters: Chinka ordered an oat-milk latte for the Man. She\'s stalling him! The Esplanade, now!"',
  '43-6': '"DJ Wub-Lord drops the beat, and a clue: the Man stomped off toward Theme Camp Row."',
  '43-7': '"A lamplighter\'s lantern! Dark levels and dust storms are easier to see through now."',
  '44-6': '"Grand Witch Moonbeam read your aura: deeply annoyed. She saw Chinka out past the hot springs."',
  '45-6': '"The Geyser Guardian burbles happily. The Man waded into the deep playa, still carrying Chinka."',
  '45-7': '"Bike Repair Camp tuned you up. Brady runs faster now. You\'re welcome."',
  '46-6': '"Dust Devil Diablo spins out. Through the settling dust: the Man\'s pavilion, glowing on the horizon."',
  '46-7': '"Hydration Station topped you up: you start every level big now. Drink water. Seriously."',
  '47-3': '"Forklift Frank waves you on. He\'ll pretend he never saw you."',
  '47-6': '"Foreman Rusty radios it in: \'Brady is coming for the Man.\' Somewhere, the whole city cheers."',
  '48-4': '"The Glitter Queen lost her shine. The pavilion is right there, and Chinka is waving from the top!"',
  '48-5': '"The Man burns. Chinka is free. Little toad wipes away a little tear."',
  '49-5': '"Bouncer Brutus steps aside. You\'re on the list now. Forever. And someone left a page lying around..."',
  '50-4': '"The Archivist closes the book. Some stories are worth telling twice. Thanks for finding World 22."'
};
const FINALE_LEVELS = { '48-5': 'world' };

class StoryScene {
  // panels: [{ scene: fn(ctx, W, H, t) , text }], then calls next()
  constructor(panels, next, music) {
    this.panels = panels; this.i = 0; this.t = 0; this.pt = 0; this.next = next;
    Input.setMode('ui'); Sound.music(music || 'story');
    this.build();
  }
  build() {
    const W = Game.cssW, H = Game.cssH;
    this.skip = [{ x: W - Math.max(14, insets.r + 8) - 86, y: Math.max(12, insets.t + 6), w: 86, h: 34, label: 'SKIP ▶▶', size: 11, fn: () => this.finish() }];
  }
  resize() { this.build(); }
  finish() { if (this.done) return; this.done = true; Sound.play('select'); this.next(); }
  update(dt) {
    this.t += dt; this.pt += dt;
    const hit = UI.hitButtons(this.skip); if (hit) { hit.fn(); return; }
    if ((Input.taps.length || Input.uiKey === 'enter' || Input.jumpPressed) && this.pt > 0.6) {
      this.i++; this.pt = 0; Sound.play('cardFlip');
      if (this.i >= this.panels.length) this.finish();
    }
  }
  draw(ctx) {
    const W = Game.cssW, H = Game.cssH;
    const p = this.panels[Math.min(this.i, this.panels.length - 1)];
    ctx.setTransform(Game.dpr, 0, 0, Game.dpr, 0, 0);
    ctx.save(); p.scene(ctx, W, H, this.t, this.pt); ctx.restore();
    ctx.setTransform(Game.dpr, 0, 0, Game.dpr, 0, 0);
    // caption card
    const a = Math.min(1, this.pt * 3);
    const bw = Math.min(W - 40, 680), bx = (W - bw) / 2, by = H - Math.max(16, insets.b + 10) - 92;
    ctx.save(); ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(10,6,20,0.82)'; rr(ctx, bx, by, bw, 84, 16); ctx.fill();
    ctx.strokeStyle = 'rgba(255,216,74,0.5)'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.font = `${W < 600 ? 13 : 15}px ${FONT_UI}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const lines = wrapText(ctx, p.text, bw - 40);
    lines.forEach((l, k) => ctx.fillText(l, W / 2, by + 42 + (k - (lines.length - 1) / 2) * 20));
    ctx.font = `10px ${FONT_DISPLAY}`; ctx.fillStyle = 'rgba(255,216,74,0.8)';
    ctx.fillText(this.i < this.panels.length - 1 ? 'TAP TO CONTINUE' : 'TAP TO START', W / 2, by + 74 + Math.sin(this.t * 4) * 1.5);
    ctx.restore();
    // panel dots
    for (let k = 0; k < this.panels.length; k++) { ctx.fillStyle = k === this.i ? '#ffd84a' : 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.arc(W / 2 - (this.panels.length - 1) * 8 + k * 16, by - 12, 3.5, 0, TAU); ctx.fill(); }
    UI.drawButtons(ctx, this.skip);
  }
}
function wrapText(ctx, text, maxW) {
  const words = text.split(' '), lines = []; let line = '';
  for (const w of words) { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; }
  if (line) lines.push(line);
  return lines;
}

/* illustrated panels, drawn live with the game's own art */
function storyStage(ctx, W, H, t, theme) {
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  const S = Game.dpr * H / (VIEW_ROWS * TS);
  BG.draw(ctx, theme, t * 12, 0, 0, Game.cssW * Game.dpr / S, VIEW_ROWS * TS, S, t, 0);
  ctx.restore();
  ctx.setTransform(Game.dpr, 0, 0, Game.dpr, 0, 0);
  const gy = H * 0.72;
  const g = ctx.createLinearGradient(0, gy, 0, H); g.addColorStop(0, 'rgba(20,12,30,0.85)'); g.addColorStop(1, 'rgba(6,4,10,1)');
  ctx.fillStyle = g; ctx.fillRect(0, gy, W, H - gy);
  return { gy, s: Math.min(2.6, H / 150) };
}
// kept for anything that still asks for the original intro: it tells the new story now
function introPanels() { return worldIntroPanels(); }
function worldIntroPanels() {
  const brady = (ctx, x, y, s, t, st, facing) => { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); drawBrady(ctx, { x: 0, y: 0, facing: facing || 1, small: false, power: 0, anim: { state: st || 'idle', t, phase: t * 12, speed: 1 }, hair: null, look: Save.data.look, time: t }); ctx.restore(); };
  const chinka = (ctx, x, y, s, t, pose, facing) => drawChinka(ctx, { x, y, scale: s, t, pose, facing: facing || -1 });
  const hearts = (ctx, x, y, s, t) => { for (let i = 0; i < 4; i++) { const k = (t * 0.6 + i / 4) % 1; ctx.fillStyle = `rgba(255,90,160,${1 - k})`; ctx.font = `${12 + i * 3}px ${FONT_UI}`; ctx.textAlign = 'center'; ctx.fillText('\u2665', x + Math.sin(t * 2 + i) * 14 * s, y - k * 60 * s); } };
  return [
    { text: 'Burn week. Brady and Chinka rolled down Gate Road at sunset: goggles on, playlist ready, a sloth asleep in the back.',
      scene(ctx, W, H, t) { const { gy, s } = storyStage(ctx, W, H, t, 'gate'); brady(ctx, W * 0.38, gy, s, t, 'idle', 1); chinka(ctx, W * 0.5, gy, s, t, 'wave', -1); } },
    { text: 'That night the Man looked down from his pavilion: forty feet of wood, a glowing diamond head... and he fell head over lattice for Chinka.',
      scene(ctx, W, H, t) { const { gy, s } = storyStage(ctx, W, H, t, 'manbase'); ManArt.figure(ctx, W * 0.66, gy, s * 1.6, t, { lit: true }); hearts(ctx, W * 0.66, gy - 150 * s, s, t); chinka(ctx, W * 0.3, gy, s, t, 'wave', 1); } },
    { text: 'He scooped her up and carried her to the top of his pavilion. "MINE," he boomed. Nobody had ever heard the Man talk before.',
      scene(ctx, W, H, t, pt) { const { gy, s } = storyStage(ctx, W, H, t, 'manbase'); const k = Math.min(1, pt * 0.5); ManArt.figure(ctx, W * (0.6 + k * 0.1), gy, s * 1.6, t, { lit: true, cage: true, arms: true, angry: true }); brady(ctx, W * 0.24, gy, s, t, 'run', 1); if (pt < 0.4) { ctx.fillStyle = `rgba(255,255,255,${0.6 * (1 - pt / 0.4)})`; ctx.fillRect(0, 0, W, H); } } },
    { text: 'Brady woke Slothy from his hammock. Across the whole playa, land by land, all the way to the Man: hold on, Chinka. We\'re coming.',
      scene(ctx, W, H, t) { const { gy, s } = storyStage(ctx, W, H, t, 'deepplaya'); ctx.save(); ctx.translate(W * 0.45, gy); ctx.scale(s, s); drawSlothy(ctx, { x: 0, y: 0, facing: 1, t, pose: 'walk' }); drawBrady(ctx, { x: -4, y: -24, facing: 1, small: false, power: 0, anim: { state: 'ride', t, phase: 0 }, hair: null, look: Save.data.look, time: t }); ctx.restore(); } }
  ];
}

class EndingScene {
  constructor(set) {
    this.set = set; this.t = 0; this.stage = 0; Input.setMode('ui'); Sound.music('ending'); Sound.play('reunion');
    this.lines = [
      "The Man's diamond head flickers. He sets Chinka down very, very gently.",
      'Chinka: "You came all this way for me?"  Brady: "Through Gate Road traffic. Twice."',
      "Saturday night. The Man burns, and for once he doesn't seem to mind.",
      'Brady and Chinka watch the fire together. Slothy naps. Best. Burn. Ever.'
    ];
    this.parts = new Particles();
    Save.data.beatGame = true; Save.save();
  }
  update(dt) {
    this.t += dt; this.parts.update(dt);
    if (Math.random() < 0.08) this.parts.burst(Math.random() * Game.cssW, Game.cssH * (0.1 + Math.random() * 0.3), 30, '#fff', 'firework');
    if (Math.random() < 0.05) this.parts.burst(Game.cssW * 0.5, Game.cssH * 0.6, 3, '#ff4f8a', 'confetti');
    if ((Input.taps.length || Input.uiKey === 'enter' || Input.jumpPressed) && this.t > 1) {
      this.stage++; this.t = 1;
      if (this.stage >= this.lines.length) { Game.setScene(new CreditsScene(this.set)); return; }
      Sound.play('cardFlip');
    }
  }
  draw(ctx) {
    const W = Game.cssW, H = Game.cssH;
    ctx.setTransform(Game.dpr, 0, 0, Game.dpr, 0, 0);
    const { gy, s } = storyStage(ctx, W, H, this.t, 'burn');
    const k = Math.min(1, this.t / 2.5);
    ctx.save(); ctx.translate(W * 0.5 - 40 * s * (1 - k), gy); ctx.scale(s * 1.1, s * 1.1);
    drawBrady(ctx, { x: 0, y: 0, facing: 1, small: false, power: 0, anim: { state: this.stage >= 3 ? 'victory' : 'idle', t: this.t, phase: 0 }, hair: null, look: Save.data.look, time: this.t });
    ctx.restore();
    drawChinka(ctx, { x: W * 0.5 + 30 * s + 40 * s * (1 - k), y: gy, scale: s * 1.1, t: this.t, pose: this.stage >= 3 ? 'cheer' : 'wave', facing: -1 });
    ctx.save(); ctx.translate(W * 0.28, gy); ctx.scale(s * 0.9, s * 0.9); drawSlothy(ctx, { x: 0, y: 0, facing: 1, t: this.t, pose: 'sleep' }); ctx.restore();
    if (k >= 1) for (let i = 0; i < 3; i++) { const hy = gy - 90 * s - ((this.t * 30 + i * 30) % 90); ctx.fillStyle = `rgba(255,80,140,${1 - ((this.t * 30 + i * 30) % 90) / 90})`; ctx.font = `${16 + i * 4}px ${FONT_UI}`; ctx.textAlign = 'center'; ctx.fillText('♥', W * 0.5 + 10 * s + Math.sin(this.t * 2 + i) * 12, hy); }
    ctx.setTransform(Game.dpr, 0, 0, Game.dpr, 0, 0);
    this.parts.draw(ctx);
    const bw = Math.min(W - 40, 640), bx = (W - bw) / 2, by = Math.max(20, insets.t + 14);
    ctx.fillStyle = 'rgba(10,6,20,0.78)'; rr(ctx, bx, by, bw, 64, 14); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = `${W < 600 ? 13 : 16}px ${FONT_UI}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(this.lines[Math.min(this.stage, this.lines.length - 1)], W / 2, by + 26);
    ctx.font = `10px ${FONT_DISPLAY}`; ctx.fillStyle = '#ffd84a'; ctx.fillText('TAP', W / 2, by + 50);
  }
}
