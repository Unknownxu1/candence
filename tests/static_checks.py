from pathlib import Path
import importlib.util,tempfile,json,re,hashlib,shutil
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'tests/artifacts';OUT.mkdir(parents=True,exist_ok=True)
def load(name,path):
    spec=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
creator=load('creator',ROOT/'scripts/create_report.py');bundle=load('bundle',ROOT/'scripts/bundle_html.py');installer=load('installer',ROOT/'scripts/install_skill.py')
text=(ROOT/'SKILL.md').read_text(encoding='utf-8');front=re.match(r'^---\n(.*?)\n---',text,re.S).group(1)
assert re.search(r'^name: cadence$',front,re.M);assert 'description:' in front;assert 'TODO' not in text
assert (ROOT/'VERSION').read_text().strip()=='0.1.1';assert json.loads((ROOT/'package.json').read_text())['version']=='0.1.1'
missing=[]
for p in [ROOT/'SKILL.md',*list((ROOT/'references').glob('*.md'))]:
    for target in re.findall(r'\]\(([^)]+)\)',p.read_text(encoding='utf-8')):
        if not target.startswith(('https:','http:','#')) and not (p.parent/target.split('#')[0]).exists():missing.append((str(p.relative_to(ROOT)),target))
assert not missing,missing
asset_links=0
for p in (ROOT/'examples').rglob('*.html'):
    for ref in re.findall(r'(?:src|href)="([^"]+)"',p.read_text(encoding='utf-8')):
        if ref.startswith(('#','http:','https:','data:','mailto:')):continue
        target=(p.parent/ref.split('#')[0].split('?')[0]).resolve();assert target.exists(),(p,ref);assert target.is_relative_to(ROOT)
        asset_links+=1
# All imported originals remain equal to their recorded hashes unless URL relocation was declared.
for item in json.loads((ROOT/'references/source-manifest.json').read_text(encoding='utf-8')):
    expected=item.get('artifactSha256',item.get('sha256'));assert hashlib.sha256((ROOT/item['destination']).read_bytes()).hexdigest()==expected,item['destination']
# Simulated installation in an isolated skills root, not the user's real configuration.
with tempfile.TemporaryDirectory(prefix='cadence-install-') as temp:
    installed=installer.install(Path(temp)/'skills')
    assert installed.name=='cadence'
    discovered=[p for p in installed.parent.iterdir() if (p/'SKILL.md').is_file()]
    assert installed in discovered;assert (installed/'SKILL.md').read_text(encoding='utf-8')==text
    for ref in re.findall(r'\]\(([^)]+)\)',text):assert (installed/ref).exists(),ref
    try:installer.install(installed.parent)
    except FileExistsError:pass
    else:raise AssertionError('Installer overwrote an existing skill')
    generated=Path(temp)/'generated'
    spec=creator.validate(json.loads((ROOT/'tests/fixtures/causal.json').read_text(encoding='utf-8')));generated.mkdir();shutil.copytree(installed/'assets',generated/'assets')
    (generated/'index.html').write_text(creator.generate(spec),encoding='utf-8');single=bundle.bundle(generated/'index.html');assert 'src="assets/' not in single;assert 'href="assets/' not in single;assert 'bundled-font-licenses' in single and 'SIL OPEN FONT LICENSE' in single
# Data checks: missing CI level, reversed intervals and non-zero bar baseline are rejected.
bad=[]
for mutate in [lambda s:s['charts'][0].pop('intervalLabel'),lambda s:s['charts'][0]['rows'][0].update(low=8),lambda s:s['charts'][0].update(domain=[5,9])]:
    spec=json.loads((ROOT/'tests/fixtures/causal.json').read_text(encoding='utf-8'));mutate(spec)
    try:creator.validate(spec)
    except (AssertionError,KeyError,ValueError):bad.append(True)
    else:raise AssertionError('Invalid statistical input was accepted')
s=json.loads((ROOT/'tests/fixtures/service-operations.json').read_text(encoding='utf-8'));assert sum(r['value'] for r in s['charts'][0]['rows'])==sum(r['value'] for r in s['charts'][1]['rows'])==720
rank=json.loads((ROOT/'examples/rank-logit/data/analysis.json').read_text(encoding='utf-8'));assert rank['simulation'] and rank['n']==1600
# Host dependencies and absolute paths must not sneak into active entrypoints/runtime.
for p in [*list((ROOT/'scripts').glob('*.py')),*list((ROOT/'assets/runtime').glob('*.js'))]:assert not re.search(r'(?<![A-Za-z])[A-Za-z]:[\\/]|/Users/|/home/',p.read_text(encoding='utf-8')),p
result={'skillFrontmatterReadable':True,'isolatedInstallAndDiscoveryScan':True,'hostAgentAutomaticInvocationTested':False,'installedReferencesResolvable':True,'rejectOverwrite':True,'relocatableBundle':True,'statisticalInputRejections':len(bad),'localAssetLinks':asset_links,'sourceManifestExact':True,'threeFixturesAvailable':True,'fontLicensesPresent':all((ROOT/'assets/foundation/hallmark/fonts'/n).exists() for n in ['OFL-sans.txt','OFL-serif.txt'])}
(OUT/'static-results.json').write_text(json.dumps(result,indent=2),encoding='utf-8');print('Static checks passed:',json.dumps(result))
