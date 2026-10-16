"""Rebuild fictional ice-cream examples from local public inputs only."""
from pathlib import Path
import importlib.util,shutil,json,re,hashlib
ROOT=Path(__file__).resolve().parents[1]
def module(name,path):
    spec=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
creator=module('creator',ROOT/'scripts/create_report.py');bundler=module('bundler',ROOT/'scripts/bundle_html.py')
for fixture,name in [('causal.json','causal-inference'),('service-operations.json','service-operations')]:
    dest=ROOT/'examples'/name;dest.mkdir(parents=True,exist_ok=True);source=ROOT/'tests/fixtures'/fixture
    s=creator.validate(json.loads(source.read_text(encoding='utf-8')))
    shutil.copytree(ROOT/'assets',dest/'assets',dirs_exist_ok=True);shutil.copyfile(source,dest/'source.json')
    (dest/'index.html').write_text(creator.generate(s),encoding='utf-8')
    if name=='causal-inference':(dest/'standalone.html').write_text(bundler.bundle(dest/'index.html'),encoding='utf-8')
# Build the standalone Golden example from the fictional sales fixture.
sales=creator.validate(json.loads((ROOT/'tests/fixtures/service-operations.json').read_text(encoding='utf-8')))
(ROOT/'examples/golden-source.json').write_text(json.dumps(sales,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(ROOT/'examples/golden-first.html').write_text(bundler.bundle(ROOT/'examples/service-operations/index.html'),encoding='utf-8')
rank=json.loads((ROOT/'examples/rank-logit/data/analysis.json').read_text(encoding='utf-8'))
assert rank['scenario']=='fictional-ice-cream' and rank['seed']==7319 and rank['n']==1600
for name in ['index.html','stable-v3.html']:
    p=ROOT/'examples/rank-logit'/name;s=p.read_text(encoding='utf-8')
    s,n=re.subn(r'(<script id="analysis-data" type="application/json">).*?(</script>)',lambda m:m[1]+'\n'+json.dumps(rank,ensure_ascii=False,separators=(',',':'))+'\n'+m[2],s,flags=re.S)
    assert n==1
    s=re.sub(r'18–24 天仅 \d+ 位试吃参与者（[\d.]+%）',f"18–24 天仅 {rank['tailN']} 位试吃参与者（{100*rank['tailN']/rank['n']:.1f}%）",s)
    p.write_text(s,encoding='utf-8')
records=[]
for folder in ['assets','examples']:
    for p in sorted((ROOT/folder).rglob('*')):
        if not p.is_file() or '__pycache__' in p.parts:continue
        records.append({'source':'Cadence asset or synthetic example','destination':p.relative_to(ROOT).as_posix(),'artifactSha256':hashlib.sha256(p.read_bytes()).hexdigest(),'status':'artifact integrity record'})
(ROOT/'references/source-manifest.json').write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Fictional examples rebuilt; public artifact hashes refreshed.')
