#!/bin/zsh
# Renders and packs one country's Fiesta Toon atlases: its enemies/items module(s) and every theme module.
#   tools/blender/sprites/build_country.sh <cc> [workdir] [part ...]
#     part: 'enemies' and/or theme keys (e.g. ec_andes) to rebuild only those atlases (default: everything)
#     KINDS=a,b renders only those kinds into a preview spec (no pack), for iterating on a model.
# Enemy modules: <cc>_enemies*.py (Mexico: pepper_kind.py + mx_enemies_a.py + mx_enemies_b.py, packed into one atlas);
# theme modules: <cc>_*.py that define LAYERS (see COUNTRIES.txt and docs/SPRITE_BRIEF.md).
# Blender runs as a private GUI instance through gui/bl.sh (background mode crashes on this Mac).
set -e
CC=$1; WORK=${2:-/tmp/brady-sprites/$CC}; shift $(( $# > 1 ? 2 : 1 )); PARTS=("$@")
HERE=${0:A:h}; ROOT=${HERE:h:h:h}; OUT=$ROOT/assets/sprites/super-brady-o-world; BL=$HERE/gui/bl.sh
mkdir -p "$WORK" "$OUT"
want() { [ ${#PARTS} -eq 0 ] || (( ${PARTS[(Ie)$1]} )); }
size() { [ -f "$1" ] && echo "$(( $(stat -f %z "$1") / 1024 )) KB" || echo "none"; }
EMODS=()
[ "$CC" = mx ] && EMODS+=(pepper_kind)
for M in $HERE/${CC}_enemies*.py(N); do EMODS+=(${M:t:r}); done
if (( ${#EMODS} )) && want enemies; then
  SPECS=()
  for E in $EMODS; do
    rm -rf "$WORK/$E"
    JOB=enemies:$E LOOK=toon OUT=$WORK/$E NAME=$CC SCALE=3 OUTLINE=1.25 $BL $WORK/$E.log $HERE/render_country.py || true
    SPECS+=($WORK/$E/spec.json)
  done
  if [ -z "$KINDS" ]; then
    BEFORE=$(size $OUT/$CC.webp)
    $BL $WORK/${CC}_pack.log $HERE/pack_atlas.py $SPECS $OUT/$CC; grep -E "PACKED|Error" $WORK/${CC}_pack.log || true
    echo "$CC atlas: $BEFORE -> $(size $OUT/$CC.webp)"
  fi
fi
[ -n "$KINDS" ] && exit 0
for M in $HERE/${CC}_*.py(N); do
  T=${M:t:r}; [[ $T == ${CC}_enemies* ]] && continue
  grep -q '^LAYERS' $M || continue
  want $T || continue
  rm -rf "$WORK/$T"
  JOB=bg:$T LOOK=toon OUT=$WORK/$T NAME=$T SCALE=2 OUTLINE=0.9 $BL $WORK/$T.log $HERE/render_country.py || true
  BEFORE=$(size $OUT/$T.webp)
  $BL $WORK/${T}_pack.log $HERE/pack_atlas.py $WORK/$T/spec.json $OUT/$T; grep -E "PACKED|Error" $WORK/${T}_pack.log || true
  echo "$T atlas: $BEFORE -> $(size $OUT/$T.webp)"
done
