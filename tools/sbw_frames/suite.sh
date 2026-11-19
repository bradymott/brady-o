#!/bin/zsh
# usage: suite.sh <label>  -- copies the worktree at HEAD, builds, runs the whole pre-merge list one at a time
set -u
L=$1; S=${SBW_SCRATCH:?set SBW_SCRATCH to a folder holding the worktree as \$SBW_SCRATCH/items}
R=$S/suite-$L; rm -rf $R; mkdir -p $R
git -C $S/items worktree add --detach $R/repo HEAD >/dev/null 2>&1 || { rm -rf $R/repo; git -C $S/items archive HEAD | (mkdir -p $R/repo && tar -x -C $R/repo); }
ln -s /Users/bradymott/brady-o/node_modules $R/repo/node_modules
cd $R/repo; export BRADY_DIST=$R/dist; O=$R/out; mkdir -p $O/gp $O/boss $O/apps $O/tk
node tools/build.js > $O/build.txt 2>&1
run() { local n=$1; shift; "$@" > $O/$n.txt 2>&1; echo "$n exit=$? pass=$(grep -c '^PASS' $O/$n.txt) fail=$(grep -c '^FAIL' $O/$n.txt) :: $(tail -1 $O/$n.txt | cut -c1-160)" >> $R/summary.txt; }
run validate node tools/validate_levels.js --rules
run gameplay node tools/gameplay_test.js $O/gp
run boss node tools/boss_test.js --shots $O/boss
run apps node tools/apps_test.js "" $O/apps
run graphics node tools/sbw_graphics_test.js
run atlas node tools/sbw_atlas_test.js
run toolkit node tools/sbw_toolkit_test.js
run powers node tools/sbw_powers_test.js
run overworld node tools/sbw_overworld_test.js
run soak node tools/sbw_soak_test.js
run save node tools/save_test.js
run snapshot node tools/sbw_snapshot.js
run br_mz node tools/levels_br_mz_test.js
run aq_w22 node tools/levels_aq_w22_test.js
run tkshots node tools/sbw_toolkit_shots.js $O/tk --checks
run items node tools/sbw_items_test.js
echo DONE >> $R/summary.txt
