// Valencia 6-5: Paellasaurus. Tomato artillery: stomps bounce off the boiling pan; three tomatoes kicked into
// the pan put the fire out, and only then does a stomp crack the crust.
module.exports = async ({ page, check, shot }) => {
  const r = await page.evaluate(() => {
    const out = {}, TSZ = 32;
    start('6-5'); clearEnemies();
    const g = S(), p = P(), b = boss();
    out.crates = g.entities.filter(e => e.constructor.name === 'EsCrate').length;
    enterArena(); p.invuln = 99;
    out.woke = b.state === 'fight'; out.name = b.name; out.hp0 = b.hp; out.heat0 = b.heat;
    // the crates spill tomatoes on their own
    sim(3.5); out.tomatoes = g.entities.filter(e => e.prop && e.cfg.tomato && !e.remove).length;
    // a stomp on the hot pan bounces off
    b.go('walk'); sim(0.05); b.vx = 0; p.x = b.cx - p.w / 2; p.y = b.y - p.h - 30; p.vy = 0; sim(0.5); out.hotStompHp = b.hp;
    // Brady kicks a tomato into the pan: one flame out (loose tomatoes are cleared first so only this one counts)
    const clearT = () => { for (const e of g.entities) { if (e.prop && e.cfg.tomato) e.remove = true; if (e.constructor.name === 'EsCrate') e.cool = 99; } sim(0.02); };
    clearT(); b.go('rice'); b.vx = 0; const t1 = spawnAt('esTomatoProp', b.cx - 4 * TSZ, b.floorY); sim(0.3); p.x = t1.x - p.w - 60; p.y = b.floorY - p.h; p.vy = 0;
    let n = 0; while (b.heat === 3 && n++ < 240) sim(1 / 120, { right: true }); out.heat1 = b.heat; sim(0.3);
    // the signature tomato lob counts too
    clearT(); b.go('rice'); b.vx = 0; p.collect('sig:tomato'); p.x = b.x - 1.6 * TSZ - p.w; p.y = b.floorY - p.h; p.vy = 0; p.facing = 1; sim(0.05, { actionPressed: true });
    n = 0; while (b.heat === out.heat1 && n++ < 240) sim(1 / 120); out.heat2 = b.heat; p.sig = null;
    // the third tomato, stomp-launched, puts the fire out: cold, sluggish, stompable
    clearT(); b.go('rice'); b.vx = 0; const t3 = spawnAt('esTomatoProp', b.cx - 3 * TSZ, b.floorY); sim(0.3); p.x = t3.cx - p.w / 2; p.y = t3.y - p.h - 20; p.vy = 0; p.vx = 0; p.facing = 1;
    n = 0; while (b.act !== 'cold' && n++ < 360) sim(1 / 120); sim(0.05);
    out.cold = b.act === 'cold' && b.vuln && b.heat === 0;
    p.x = b.cx - p.w / 2; p.y = b.y - p.h - 30; p.vy = 0; sim(0.5); out.crackHp = b.hp; out.phase2 = b.phase === 2;
    // phase 2: the crates hop on the floor lights and rockets come up through the floor
    sim(1.5); out.hopping = g.entities.filter(e => e.constructor.name === 'EsCrate' && e.hop).length;
    b.go('rockets'); sim(0.2); out.rockets = g.entities.filter(e => e.constructor.name === 'EsRocket').length;
    // a relit pan is hot again
    sim(2); out.relit = b.heat === 3 && !b.vuln;
    return out;
  });
  check('Paellasaurus wakes when Brady walks in; three tomato crates stand in the hall', r.woke && /PAELLA/.test(r.name) && r.crates >= 3, r);
  check('the crates spill tomatoes on their own', r.tomatoes >= 1, r);
  check('stomping the boiling pan bounces off', r.hotStompHp === r.hp0 && r.heat0 === 3, r);
  check('a kicked tomato puts one flame out', r.heat1 === 2, r);
  check('the signature tomato lob counts as a tomato', r.heat2 === 1, r);
  check('a stomp-launched third tomato puts the fire out: cold and stompable', r.cold, r);
  check('a stomp on the cold pan cracks the crust (damage, phase 2)', r.crackHp === r.hp0 - 1 && r.phase2, r);
  check('phase 2: crates hop and rockets launch from the floor', r.hopping >= 3 && r.rockets === 3, r);
  check('the pan relights after the crust cracks', r.relit, r);
  const r2 = await page.evaluate(() => {
    const out = {}, g = S(), p = P(), b = boss();
    b.damage(1); sim(2.5);
    const row = b.floorY / 32; let ice = 0; for (let tx = Math.floor(b.arenaX0 / 32); tx < Math.floor(b.arenaX1 / 32); tx++) if (g.area.tiles[row * g.area.W + tx] === 11) ice++;
    out.phase3 = b.phase === 3; out.ice = ice;
    b.go('skate'); sim(1.2); out.skating = b.act === 'skate' && Math.abs(b.vx) > 200;
    p.x = b.cx - 160; p.y = b.floorY - p.h; p.vy = 0;
    return out;
  });
  check('phase 3: the pan flips and the floor floods with sliding tomato pulp; it skates', r2.phase3 && r2.ice >= 12 && r2.skating, r2);
  await page.waitForTimeout(120);
  await shot('es-01-paellasaurus-pulp.png');
  const r3 = await page.evaluate(() => {
    const out = {}, g = S(), p = P(), b = boss();
    // the last two hits through the mechanic again: three tomatoes, then the stomp
    const three = () => { b.go('walk'); let n = 0; while (b.act !== 'cold' && n++ < 1200) { if (n % 60 === 1) { const t = spawnAt('esTomatoProp', b.cx + (p.cx < b.cx ? -1 : 1) * 120, b.floorY - 10); t.fling((b.cx - t.cx) * 4, -2 * 32, p); } sim(1 / 120); } return b.act === 'cold'; };
    out.cold3 = three(); p.x = b.cx - p.w / 2; p.y = b.y - p.h - 30; p.vy = 0; sim(0.5); out.hp3 = b.hp;
    sim(2); out.cold4 = three(); p.x = b.cx - p.w / 2; p.y = b.y - p.h - 30; p.vy = 0; sim(0.5); out.hp4 = b.hp; out.clatter = b.act === 'clatter';
    return out;
  });
  check('in phase 3 three more tomatoes and a stomp still work', r3.cold3 && r3.hp3 === 1, r3);
  check('the last crack sends the pan clattering over', r3.cold4 && r3.hp4 <= 0.01 && r3.clatter, r3);
  await page.evaluate(() => { sim(0.9); });
  await page.waitForTimeout(120);
  await shot('es-02-paellasaurus-rain.png');
  const r4 = await page.evaluate(() => {
    const g = S(), p = P(), b = boss(); const doorX = b.doorX, row = b.floorY / 32 - 1;
    sim(6);
    const out = { removed: !!b.remove, door: g.area.tiles[row * g.area.W + doorX] === 0 };
    p.x = (doorX + 8) * 32; p.y = b.floorY - p.h; p.vy = 0; sim(2.5); out.state = g.state;
    return out;
  });
  check('Paellasaurus is gone, the door opens and the level can be finished', r4.removed && r4.door && /clear|tally|results/.test(r4.state), r4);
};
