#!/bin/bash
# runs the remaining suites one at a time; one summary line block per suite
cd /private/tmp/claude-501/-Users-bradymott-brady-o/71b2e596-7cb8-425f-a055-e086cc0da06c/scratchpad/title
export BRADY_DIST=/private/tmp/claude-501/-Users-bradymott-brady-o/71b2e596-7cb8-425f-a055-e086cc0da06c/scratchpad/dist-title
T=/private/tmp/claude-501/-Users-bradymott-brady-o/71b2e596-7cb8-425f-a055-e086cc0da06c/scratchpad/title-work/tests
run() { name=$1; shift; node "$@" > $T/$name.log 2>&1; code=$?; echo "== $name exit=$code fails=$(grep -c '^FAIL' $T/$name.log) passes=$(grep -c '^PASS' $T/$name.log)"; tail -2 $T/$name.log; }
run boss tools/boss_test.js --shots $T/boss
run apps tools/apps_test.js "" $T/apps
run graphics tools/sbw_graphics_test.js
run atlas tools/sbw_atlas_test.js
run toolkit tools/sbw_toolkit_test.js
run powers tools/sbw_powers_test.js
run overworld tools/sbw_overworld_test.js
run soak tools/sbw_soak_test.js
run save tools/save_test.js
run snapshot tools/sbw_snapshot.js
run brmz tools/levels_br_mz_test.js
run aqw22 tools/levels_aq_w22_test.js
run shots tools/sbw_toolkit_shots.js $T/kitshots --checks
echo ALLDONE
