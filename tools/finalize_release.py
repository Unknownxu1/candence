"""Collect browser evidence for the public fictional examples."""
from pathlib import Path
import json,shutil,hashlib
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'validation';OUT.mkdir(exist_ok=True)
b=json.loads((ROOT/'tests/artifacts/browser-results.json').read_text(encoding='utf-8'))
s=json.loads((ROOT/'tests/artifacts/static-results.json').read_text(encoding='utf-8'))
assert len(b['records'])==3 and not b['errors'] and not b['networkRequests'] and not b['failedRequests']
for name in ['browser-results.json','static-results.json']:
    shutil.copyfile(ROOT/'tests/artifacts'/name,OUT/name)
selected=[]
for case in ['causal-inference','rank-logit','service-operations']:
    for suffix in ['first','full','mobile-first','methods','fallback-first','newspaper-first']:
        name=f'{case}-{suffix}.png';shutil.copyfile(ROOT/'tests/artifacts'/name,OUT/name);selected.append(name)
for name in ['single-file-first.png','relocated-service-first.png','golden-first.png','golden-mobile.png']:
    shutil.copyfile(ROOT/'tests/artifacts'/name,OUT/name);selected.append(name)
im=Image.new('RGB',(1800,469),'white');draw=ImageDraw.Draw(im);font=ImageFont.load_default(size=20)
for i,(case,label) in enumerate([('causal-inference','Fictional tasting / display inputs'),('rank-logit','Fictional ice-cream / fitted ranking'),('service-operations','Fictional ice-cream / sales')]):
    shot=Image.open(OUT/f'{case}-first.png').convert('RGB').resize((600,417));im.paste(shot,(600*i,52));draw.text((600*i+12,16),label,font=font,fill='#303036')
im.save(OUT/'three-scenarios.png');selected.append('three-scenarios.png')
(OUT/'screenshots-manifest.json').write_text(json.dumps({'source':'fresh actual browser screenshots of fictional ice-cream cases; collage uniformly scaled','files':{name:hashlib.sha256((OUT/name).read_bytes()).hexdigest() for name in selected}},indent=2),encoding='utf-8')
audit=f'''# Cadence v{(ROOT/'VERSION').read_text().strip()} · 当前工作树验证

执行机制的独立验证见 [v0.1.1 validation](docs/v0.1.1-validation.md)。本工具仅收集报告回归证据，不代表已经执行全部执行机制测试。

公开示例使用虚构冰激淋场景；本记录说明其数据性质与实际验证范围。

## 已实际验证

- 静态检查：入口、隔离安装、相对资源、产物哈希、输入边界、单文件和 OFL 许可。
- 真实浏览器 {b['browser']}：三个场景，每场景 1440/768/390/320 宽度，主题/字体与风格切换合计 {sum(r['designStates'] for r in b['records'])} 次。
- 表格与数据源、区间/条形几何、排序模型切换和 CSV、方法展开、模拟字体降级、axe、单文件与目录迁移；浏览器错误及报告运行 HTTP 请求均为零。
- 新 Golden 为冰激淋销量单文件，实际渲染桌面与手机。截图见 [validation](validation/three-scenarios.png)。

## 数据与成熟度

因果图使用手工指定展示效应和区间，没有实施试验；销量使用虚构计数；排序用种子 7319 独立生成并拟合 1,600 名虚构试吃者，无外部数据。四个 Expressive Style Pack 仍实验性；未测试新宿主 Agent 自主调用、Safari/Firefox 或真机。字体子集不能保证覆盖全部新语料。

## 发布前仍需确认

示例的数据性质与使用约定见 [Example Data](docs/example-data-policy.md)。许可与资源权利见下方授权审计。

Cadence Source-Available License 1.0 为待权利人确认的草案，设计资产权属与第三方材料仍需独立核实；详见 [授权审计](docs/licensing-review.md)。本工具不提交、推送或发布。
'''
(ROOT/'release-audit.md').write_text(audit,encoding='utf-8')
print('Collected',len(selected),'fresh fictional-example screenshots.')
