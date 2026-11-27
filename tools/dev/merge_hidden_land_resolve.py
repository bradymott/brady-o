# resolve the shared-file merge conflicts of a hidden-land branch: keep both sides (ours first)
import re, sys, subprocess
files = subprocess.run(['git','diff','--name-only','--diff-filter=U'],capture_output=True,text=True).stdout.split()
pat = re.compile(r'<<<<<<< [^\n]*\n(.*?)=======\n(.*?)>>>>>>> [^\n]*\n', re.S)
for f in files:
    s = open(f).read()
    def rep(m):
        a, b = m.group(1), m.group(2)
        if f.endswith('sbw_boxes_shots.js') or f.endswith('sbw_toolkit_test.js'): return a
        if a.strip() == b.strip(): return a
        if f.endswith('postcards.js') or (f.endswith('hats.js') and a.rstrip().endswith(']')):
            lines = a.rstrip('\n').split('\n')
            last = lines[-1]
            code = last.split('   //')[0].rstrip()
            if not code.endswith(','): lines[-1] = last.replace(code, code + ',', 1)
            a = '\n'.join(lines) + '\n'
        return a + b
    s2 = pat.sub(rep, s)
    assert '<<<<<<<' not in s2 and '>>>>>>>' not in s2, f
    open(f, 'w').write(s2); print('resolved', f)

# post-pass on the hats file: list entries that are followed by another entry get their comma; exact duplicate lines go
import os
f = 'src/28_tour_sc_hats.js'
if os.path.exists(f):
    L = open(f).read().split('\n'); out = []
    for i, ln in enumerate(L):
        s = ln.rstrip()
        if s.endswith(".split(' ')") or (s.endswith(']') and re.match(r"\s+\w+: \[", s)):
            j = i + 1
            while j < len(L) and (L[j].strip().startswith('//') or not L[j].strip()): j += 1
            nxt = L[j].strip() if j < len(L) else ''
            if nxt.startswith("'") or re.match(r"\w+: \[", nxt): ln = s + ','
        if out and ln.strip() and ln.strip().rstrip(',') == out[-1].strip().rstrip(',') and ".split(' ')" in ln: continue
        out.append(ln)
    open(f, 'w').write('\n'.join(out))
