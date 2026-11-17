// Pupo, PU-4: the level checker (docs/design/PUPO.md §7.6, src/28_tour_pc_pupoval.js). Node only.
// Sections: objects (each Pupo object, in a room where Brady alone cannot reach the gate: passes with its Nap Box, fails
// without), rules (HELPER NEEDS PUPO, CP STRANDS, a Pupo object in a noPupo area, the budget leaves Nap Boxes out),
// same (a level without a Nap Box: PupoVal.run gives exactly the validator's own result)
// usage: node tools/sbw_pupo_val_test.js [section ...]
const { boot, checker } = require('./sbw_pupo_lib');
const G = boot(), C = checker(), want = process.argv.slice(2);
const { TourBuild, Tour, Validator, TS } = G, PV = G.run('PupoVal'), L = G.LAB;
const build = spec => TourBuild.fromSpec(Tour.countries[spec.host || 'mx'], spec, 90);

C.section(want, 'objects', () => {
  for (const name of Object.keys(L.val)) {
    const a = build(L.valLevel(name)), ra = PV.run(a, {});
    const b = build(L.valLevel(name, { noBox: true })), rb = PV.run(b, {});
    C.check(`${name}: with its Nap Box the gate is reached riding Pupo (and not without him); without the box it is out of reach`, ra.exits.main && !ra.pupo.without.main && ra.pupo.needed && !rb.exits.main, { with: ra.exits, without: ra.pupo.without && ra.pupo.without.main, noBox: rb.exits });
  }
});

C.section(want, 'rules', () => {
  // a helper level must not need Pupo for its exit; a Pupo level's exit should need him
  const h = build(L.valLevel('hook', { kind: 'helper' })), rh = PV.run(h, {}), ch = PV.checks(h, rh);
  C.check('a helper level whose exit needs Pupo: HELPER NEEDS PUPO', ch.errors.some(e => /HELPER NEEDS PUPO/.test(e)), ch);
  const open = build(L.valLevel('hook', { rows: rows => rows.map((r, y) => y === 11 || y === 10 ? r.replace(/\.|\^/g, '#') : r) })), ro = PV.run(open, {}), co = PV.checks(open, ro);
  C.check('a Pupo level whose exit does not need him: a warning', co.warnings.some(w => /DOES NOT NEED PUPO/.test(w)) && !co.errors.length, co);
  // the start and the only Nap Box on a high ledge, a checkpoint below it (no way back up), then the Pupo obstacle:
  // from the checkpoint Brady is stranded without Pupo
  const ledge = extra => rows => rows.map((r, y) => { const c = r.split(''); if (y >= 4 && y <= 9) for (let x = 1; x <= 5; x++) c[x] = '#'; if (y === 9) { c[7] = 'c'; if (extra) c[8] = 'x'; } if (y === 3) { c[2] = '@'; c[4] = 'x'; } return c.join(''); });
  const strand = build(L.valLevel('hook', { rows: ledge(false) })), rs = PV.run(strand, {}), cs = PV.checks(strand, rs);
  C.check('a checkpoint past the only Nap Box, before the Pupo obstacle: CP 1 STRANDS BRADY WITHOUT PUPO', cs.errors.some(e => /CP 1 STRANDS/.test(e)), cs);
  const fixed = build(L.valLevel('hook', { rows: ledge(true) })), rf = PV.run(fixed, {}), cf = PV.checks(fixed, rf);
  C.check('...and a second Nap Box after the checkpoint fixes it', !cf.errors.length && rf.exits.main, cf);
  // a Pupo object where Pupo may not go
  const spec = L.valLevel('hook'); spec.areas[0].pupoOk = false;
  const nz = build(spec), cn = PV.checks(nz, PV.run(nz, {}));
  C.check('a Pupo object in a noPupo area is an error', cn.errors.some(e => /IN A NOPUPO AREA/.test(e)), cn.errors);
  // Nap Boxes are not power-ups
  const lv = build(L.valLevel('hook')), bu = Validator.budget(lv), n = Object.values(lv.areas[0].contents).filter(c => c === 'pupo').length;
  C.check('the power-up budget leaves Nap Boxes out (and puts them back)', n === 1 && !bu.errors.some(e => /item blocks|opportunit/.test(e) && /1 /.test(e)) && Object.values(lv.areas[0].contents).includes('pupo'), bu);
});

C.section(want, 'same', () => {
  // without a Nap Box the checker is exactly the validator: every result field the same
  const pick = r => JSON.stringify({ exits: r.exits, gold: r.gold, areas: r.areasReached, nodes: r.nodes, sims: r.sims, ok: r.ok, held: r.held });
  for (const id of ['1-1', '2-3', '3-2', '7-1']) {
    const [w, i] = id.split('-').map(Number), lvl = G.getLevel(w, i);
    if (PV.has(lvl)) continue;
    C.check(`${id}: no Nap Box, the same result as Validator.run`, pick(PV.run(lvl, {})) === pick(Validator.run(lvl, {})));
  }
});

C.done();
