"""Check example-data declarations and common accidental publication hazards."""
from pathlib import Path
import re,json
ROOT=Path(__file__).resolve().parents[1]
# General patterns, independent of any particular organization or analysis task.
blocked=[r'-----BEGIN (?:[A-Z]+ )?PRIVATE KEY-----',r'\bAKIA[A-Z0-9]{16}\b']
pattern=re.compile('|'.join(blocked));issues=[];count=0
for p in ROOT.rglob('*'):
    if not p.is_file() or any(x in p.relative_to(ROOT).parts for x in ['.git','node_modules','__pycache__','artifacts']):continue
    if p.suffix.lower() in ['.png','.woff2','.pdf']:continue
    try:s=p.read_text(encoding='utf-8-sig')
    except UnicodeDecodeError:issues.append((p.relative_to(ROOT).as_posix(),'unreviewed binary'));continue
    count+=1
    if pattern.search(s):issues.append((p.relative_to(ROOT).as_posix(),'credential-like content'))
    if p.suffix in ['.json','.html','.md','.csv','.js'] and re.search(r'[A-Za-z]:[\\/](?:workspace|Users)[\\/]',s):issues.append((p.relative_to(ROOT).as_posix(),'local workspace/user path'))
assert not issues,issues
rank=json.loads((ROOT/'examples/rank-logit/data/analysis.json').read_text(encoding='utf-8'))
assert rank['scenario']=='fictional-ice-cream' and rank['seed']==7319 and rank['n']==1600
for name in ['tests/fixtures/causal.json','tests/fixtures/service-operations.json']:
    assert json.loads((ROOT/name).read_text(encoding='utf-8'))['nature']=='simulation'
print('Public-example checks passed:',count,'text files; fixture declarations, local-path and credential-pattern checks.')
