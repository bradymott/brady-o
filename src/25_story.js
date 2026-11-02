/* ============================================================
   Story: intro panels, camp-boss messages from the little toads,
   and the ending where Brady finds Chinka as the Man burns.
   ============================================================ */
const STORY_BEATS = {
  '1-10': 'A little toad crawls out of the stolen cooler: "Rocco was just hungry. The mosquito flew Chinka west, toward Reno!"',
  '2-10': '"The Cart Lord was hoarding every glow stick in town. Lord Buzzkill? He buzzed off down Highway 447 with Chinka."',
  '3-10': '"The Sheriff only wanted company. Chinka dropped her scrunchie by the hot springs. Follow the steam!"',
  '4-10': '"The geyser calmed down. Look: Chinka drew a heart in the steam. Gate Road is next."',
  '5-10': 'Captain Hard-Hat waves you through: "Welcome home, Brady. Your wife is somewhere in the city. Probably dancing."',
  '6-10': '"DJ Wub-Lord dropped the bass, and the mosquito dropped a clue: Theme Camp Row."',
  '7-10': '"Grand Witch Moonbeam saw Chinka in her crystal: out in the deep playa, under the stars."',
  '8-10': '"The dust settles. Chinka\'s footprints lead to the Temple at dawn."',
  '9-10': '"Guru Grifter refunded your enlightenment. Hurry: Lord Buzzkill is dragging Chinka to the Man before the Burn!"',
  '11-5': '"You made it past the velvet rope. Sunrise looks good on you, Brady."',
  '12-5': '"The Trip Lord blinks. Everything is fine. Everything was always fine."',
  '22-5': '"Some stories are worth telling twice. Thanks for finding World 22."',
  '31-4': '"Rocco returns your tent. Reno awaits!"', '32-4': '"Mega-Mart is closed. For good. Onward!"',
  '33-4': '"The tumbleweed rolls away. Hot springs ahead!"', '34-4': '"Steam clears. Gate Road time."',
  '35-4': '"Welcome home, Brady!"', '36-4': '"The bass bunker goes quiet. Deep playa next."',
  '37-4': '"The dust devil spins out. The Man is in sight!"',
  '41-5': '"Ticket scanned! Center Camp is straight ahead."', '42-5': '"Coffee break over. Pick a side of the city: 3:00 or 9:00."',
  '43-6': '"The 3:00 side is grooving again. Chinka was seen near the art cars!"', '44-6': '"The 9:00 camps are free. Someone saw her in the deep playa."',
  '45-5': '"The mutant vehicle runs out of fuel. Head for the Man!"', '46-6': '"The dust devil is gone. Meet at the Man!"',
  '48-4': '"The Lost Sparkle Pony found its way home. So can you."', '49-3': '"The last song fades. The Temple glows in the distance."'
};
const FINALE_LEVELS = { '10-10': 'road', '38-4': 'classic', '47-5': 'world' };

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
function introPanels() {
  const brady = (ctx, x, y, s, t, st, facing) => { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); drawBrady(ctx, { x: 0, y: 0, facing: facing || 1, small: false, power: 0, anim: { state: st || 'idle', t, phase: t * 12, speed: 1 }, hair: null, look: Save.data.look, time: t }); ctx.restore(); };
  const chinka = (ctx, x, y, s, t, pose, facing) => drawChinka(ctx, { x, y, scale: s, t, pose, facing: facing || -1 });
  const buzz = (ctx, x, y, s, t, dir) => { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); BossArt.draw(ctx, { x: -40, y: -60, w: 80, h: 110, dir: dir || 1, world: 10, hurtT: 0 }, t); ctx.restore(); };
  return [
    { text: 'Brady and Chinka had one plan this summer: Burning Man. The car was packed. The goggles were ready.',
      scene(ctx, W, H, t) { const { gy, s } = storyStage(ctx, W, H, t, 'suburbs'); ctx.save(); ctx.translate(W * 0.7, gy); ctx.scale(s, s); Decor.car(ctx, 0, 0, t); ctx.restore(); brady(ctx, W * 0.36, gy, s, t, 'idle', 1); chinka(ctx, W * 0.46, gy, s, t, 'wave', -1); } },
    { text: 'Then, the night before they left, a giant mosquito crashed through the window.',
      scene(ctx, W, H, t, pt) { const { gy, s } = storyStage(ctx, W, H, t, 'suburbs'); const k = Math.min(1, pt * 0.8); buzz(ctx, W * (1.1 - k * 0.45), H * 0.32 + Math.sin(t * 3) * 6, s * 0.9, t, -1); brady(ctx, W * 0.32, gy, s, t, 'fall', 1); chinka(ctx, W * 0.44, gy, s, t, 'cheer', 1);
        if (pt < 0.4) { ctx.fillStyle = `rgba(255,255,255,${0.6 * (1 - pt / 0.4)})`; ctx.fillRect(0, 0, W, H); } } },
    { text: 'LORD BUZZKILL: "No art. No dancing. No fun. And definitely no Chinka!" He carried her off toward the desert.',
      scene(ctx, W, H, t, pt) { const { gy, s } = storyStage(ctx, W, H, t, 'suburbs'); const k = pt * 0.25; const bx = W * (0.55 + k * 0.4), by = H * (0.3 - k * 0.15); chinka(ctx, bx + 8, by + 70 * s * 0.5, s * 0.8, t, 'captive', 1); buzz(ctx, bx, by, s * 0.75, t, 1); brady(ctx, W * 0.3, gy, s, t, 'run', 1); } },
    { text: 'Brady tied up his man bun and grabbed his shades. Next stop: Black Rock City. Hold on, Chinka. I\'m coming.',
      scene(ctx, W, H, t) { const { gy, s } = storyStage(ctx, W, H, t, 'gate'); brady(ctx, W * 0.42, gy, s * 1.1, t, 'victory', 1); ctx.save(); ctx.translate(W * 0.62, gy - 20 * s); ctx.scale(s * 1.4, s * 1.4); Sprites.goldRecord(ctx, 0, 0, t, false); ctx.restore(); } }
  ];
}
function worldIntroPanels() {
  return [
    { text: 'After the Burn, Chinka wandered off to catch a sunrise set... and now nobody can find her.',
      scene(ctx, W, H, t) { const { gy, s } = storyStage(ctx, W, H, t, 'sunrise'); drawChinka(ctx, { x: W * 0.6, y: gy, scale: s, t, pose: 'wave', facing: -1 }); } },
    { text: 'Brady woke Slothy from his hammock. Together they set out across Black Rock City. Find Chinka!',
      scene(ctx, W, H, t) { const { gy, s } = storyStage(ctx, W, H, t, 'camps'); ctx.save(); ctx.translate(W * 0.45, gy); ctx.scale(s, s); drawSlothy(ctx, { x: 0, y: 0, facing: 1, t, pose: 'walk' }); drawBrady(ctx, { x: -4, y: -24, facing: 1, small: false, power: 0, anim: { state: 'ride', t, phase: 0 }, hair: null, look: Save.data.look, time: t }); ctx.restore(); } }
  ];
}

class EndingScene {
  constructor(set) {
    this.set = set; this.t = 0; this.stage = 0; Input.setMode('ui'); Sound.music('ending'); Sound.play('reunion');
    this.lines = [
      'Lord Buzzkill fizzled out like a bug in a zapper.',
      'Chinka: "What took you so long?"',
      'Brady: "Traffic on Gate Road."',
      'Together they watched the Man burn. Best. Burn. Ever.'
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
