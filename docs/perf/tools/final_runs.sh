cd /private/tmp/claude-501/-Users-bradymott-brady-o/71b2e596-7cb8-425f-a055-e086cc0da06c/scratchpad/perf
W=../perf-work
[ -d ../dist-final ] || cp -r ../dist-perf ../dist-final
BRADY_DIST=../dist-final node tools/sbw_perf_test.js --engine webkit --flush --pair ../dist-perfbefore --ref 1-1 --bosses --maps --spots 10 --ms 350 --label "final vs before, webkit" --out $W/final_wk.json > $W/final_wk.log 2>&1
echo wk done
BRADY_DIST=../dist-final node tools/sbw_perf_test.js --gpu --throttle 4 --pair ../dist-perfbefore --ref 1-1 --bosses --maps --spots 8 --ms 350 --no-profile --label "final vs before, chromium gpu cpu4x" --out $W/final_cpu4.json > $W/final_cpu4.log 2>&1
echo cpu done
for t in 2 5; do BRADY_DIST=../dist-final node tools/sbw_perf_test.js --engine webkit --flush --pair ../dist-perfbefore --ref 1-1 --tier $t --levels mx,br,4-5,6-4,6-5,7-5,8-2 --bosses --spots 8 --ms 350 --no-profile --out $W/final_t$t.json > $W/final_t$t.log 2>&1; done
BRADY_DIST=../dist-final node tools/sbw_perf_test.js --short --write-baseline > $W/guard_base.log 2>&1
echo ALLDONE
