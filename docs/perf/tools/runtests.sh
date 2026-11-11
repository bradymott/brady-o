# run every suite one at a time against a private build; usage: runtests.sh <tag> [suites...]
cd /private/tmp/claude-501/-Users-bradymott-brady-o/71b2e596-7cb8-425f-a055-e086cc0da06c/scratchpad/perf
W=/private/tmp/claude-501/-Users-bradymott-brady-o/71b2e596-7cb8-425f-a055-e086cc0da06c/scratchpad/perf-work/tests/$1; shift; mkdir -p $W
export BRADY_DIST=/private/tmp/claude-501/-Users-bradymott-brady-o/71b2e596-7cb8-425f-a055-e086cc0da06c/scratchpad/dist-perf
node tools/build.js > $W/build.log 2>&1 || { echo "BUILD FAILED"; exit 1; }
ALL="validate gameplay boss apps graphics atlas toolkit powers overworld soak save snapshot brmz aqw22 shots"
for t in ${@:-$ALL}; do
  case $t in
    validate) cmd="node tools/validate_levels.js --rules";;
    gameplay) cmd="node tools/gameplay_test.js $W/gameplay-shots";;
    boss) cmd="node tools/boss_test.js --shots $W/boss-shots";;
    apps) cmd="node tools/apps_test.js '' $W/apps-shots";;
    graphics) cmd="node tools/sbw_graphics_test.js";;
    atlas) cmd="node tools/sbw_atlas_test.js";;
    toolkit) cmd="node tools/sbw_toolkit_test.js";;
    powers) cmd="node tools/sbw_powers_test.js";;
    overworld) cmd="node tools/sbw_overworld_test.js";;
    soak) cmd="node tools/sbw_soak_test.js";;
    save) cmd="node tools/save_test.js";;
    snapshot) cmd="node tools/sbw_snapshot.js";;
    brmz) cmd="node tools/levels_br_mz_test.js";;
    aqw22) cmd="node tools/levels_aq_w22_test.js";;
    shots) cmd="node tools/sbw_toolkit_shots.js $W/toolkit-shots --checks";;
    perf) cmd="node tools/sbw_perf_test.js --short";;
  esac
  t0=$(date +%s); eval $cmd > $W/$t.log 2>&1; rc=$?; t1=$(date +%s)
  echo "$t exit=$rc $((t1-t0))s :: $(grep -E 'FAIL|PASSED|passed|clean|levels in|checks|ALL|problem|PROBLEM|Error' $W/$t.log | tail -2 | tr '\n' ' ' | cut -c1-220)"
done
echo ALLDONE
