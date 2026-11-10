#!/bin/zsh
# bl.sh <log> <script.py> [args after --]: runs one sprite-pipeline script in a PRIVATE Blender GUI instance and quits.
# Blender 5.2.3 on Brady's Mac crashes in background mode (-b) during Metal detection; a normal (windowed) instance
# started from the shell works. --factory-startup keeps the user's add-ons (the Blender MCP server) out of it, so the
# shared, already-open Blender window is never touched. Every env var (JOB, OUT, KINDS, ...) passes through.
#   BLENDER=<binary> (default /Applications/Blender.app/Contents/MacOS/Blender)  BL_TIMEOUT=<seconds> (default 1800)
LOG=$1; SCRIPT=${2:A}; shift 2
HERE=${0:A:h}
DRIVE_SCRIPT=$SCRIPT DRIVE_ARGS="$*" perl -e 'alarm shift; exec @ARGV' ${BL_TIMEOUT:-1800} \
  ${BLENDER:-/Applications/Blender.app/Contents/MacOS/Blender} --factory-startup --python-exit-code 1 \
  --python $HERE/driver.py > $LOG 2>&1
CODE=$?
echo "exit $CODE $(grep -c RENDERED $LOG) rendered $(grep -c Traceback $LOG) tracebacks"
exit $CODE
