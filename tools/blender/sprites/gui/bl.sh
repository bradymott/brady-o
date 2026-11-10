#!/bin/zsh
# bl.sh <log> <script.py> [args after --]   (env vars pass through) : one private Blender GUI instance per job
LOG=$1; SCRIPT=$2; shift 2
DRIVE_SCRIPT=$SCRIPT DRIVE_ARGS="$*" perl -e 'alarm shift; exec @ARGV' ${BL_TIMEOUT:-1800} \
  /Applications/Blender.app/Contents/MacOS/Blender --factory-startup --python-exit-code 1 \
  --python /private/tmp/claude-501/-Users-bradymott-brady-o/71b2e596-7cb8-425f-a055-e086cc0da06c/scratchpad/bl/driver.py > $LOG 2>&1
echo "exit $? $(grep -c RENDERED $LOG) rendered $(grep -c Traceback $LOG) tracebacks"
