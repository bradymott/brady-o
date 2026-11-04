#!/bin/zsh
# Renders and packs one country's Fiesta Toon atlases: its enemies/items module and every theme module.
#   tools/blender/sprites/build_country.sh <cc> [workdir]
# Expects tools/blender/sprites/<cc>_enemies.py and <themeKey>.py for each theme (see COUNTRIES.txt, docs guide §13).
set -e
CC=$1; WORK=${2:-/tmp/brady-sprites/$CC}; HERE=$(cd "$(dirname "$0")" && pwd); ROOT=$(cd "$HERE/../../.." && pwd)
BL=/Applications/Blender.app/Contents/MacOS/Blender; OUT=$ROOT/assets/sprites/super-brady-o-world
mkdir -p "$WORK" "$OUT"
if [ -f "$HERE/${CC}_enemies.py" ]; then
  rm -rf "$WORK/enemies"
  JOB=enemies:${CC}_enemies LOOK=toon OUT=$WORK/enemies NAME=$CC SCALE=3 OUTLINE=1.25 $BL -b -P $HERE/render_country.py > $WORK/enemies.log 2>&1 || true
  echo "$CC enemies: $(grep -c RENDERED $WORK/enemies.log) frames, $(grep -c Traceback $WORK/enemies.log) errors"
  $BL -b -P $HERE/pack_atlas.py -- $WORK/enemies/spec.json $OUT/$CC 2>&1 | grep -E "PACKED|Error" || true
fi
for M in $HERE/${CC}_*.py; do
  T=$(basename $M .py); [ "$T" = "${CC}_enemies" ] && continue
  rm -rf "$WORK/$T"
  JOB=bg:$T LOOK=toon OUT=$WORK/$T NAME=$T SCALE=2 OUTLINE=0.9 $BL -b -P $HERE/render_country.py > $WORK/$T.log 2>&1 || true
  echo "$T: $(grep -c RENDERED $WORK/$T.log) strips, $(grep -c Traceback $WORK/$T.log) errors"
  $BL -b -P $HERE/pack_atlas.py -- $WORK/$T/spec.json $OUT/$T 2>&1 | grep -E "PACKED|Error" || true
done
