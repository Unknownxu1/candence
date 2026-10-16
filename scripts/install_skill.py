"""Install into an explicitly selected skills directory; never overwrite an existing skill."""
from pathlib import Path
import shutil,argparse
ROOT=Path(__file__).resolve().parents[1]
def install(skills_dir):
    target=skills_dir.resolve()/'cadence'
    if target.exists():raise FileExistsError('Skill already exists: '+str(target))
    if ROOT==skills_dir.resolve() or ROOT in skills_dir.resolve().parents:raise ValueError('Install outside the source repository')
    shutil.copytree(ROOT,target,ignore=shutil.ignore_patterns('.git','node_modules','__pycache__','artifacts','.pytest_cache'))
    return target
if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--skills-dir',type=Path,required=True);a=p.parse_args();print(install(a.skills_dir))
