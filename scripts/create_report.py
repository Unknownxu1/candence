"""Optional small JSON-to-report helper; not an analysis engine or compulsory template."""
from pathlib import Path
import argparse,html,json,math,re,shutil

ROOT=Path(__file__).resolve().parents[1]
def escape(v):return html.escape(str(v),quote=True)
def number(v):
    if isinstance(v,bool) or not isinstance(v,(int,float)) or not math.isfinite(v):raise ValueError('Chart numbers must be finite JSON numbers')
    return v
def validate(s):
    for k in ['title','question','nature','hero','charts','methods']:assert k in s,f'Missing {k}'
    assert s['nature'] in ['simulation','observed','estimated']
    ids=[]
    for c in s['charts']:
        assert re.fullmatch(r'[a-z][a-z0-9-]*',c['id']);ids.append(c['id'])
        assert c['kind'] in ['interval','bar','trend'];assert c['rows'];assert c.get('unit')
        if c['kind']=='interval' or any('low' in r or 'high' in r for r in c['rows']):assert c.get('intervalLabel'),'Name interval type and level explicitly'
        lo,hi=map(number,c['domain']);assert lo<hi
        if 'reference' in c:assert lo<=number(c['reference'])<=hi
        if c['kind']=='bar':assert lo==0,'Count bars must start at zero'
        xs=[]
        for r in c['rows']:
            value=number(r['estimate'] if c['kind']=='interval' else r['value']);assert lo<=value<=hi
            if c['kind']=='interval' or 'low' in r or 'high' in r:
                assert lo<=number(r['low'])<=value<=number(r['high'])<=hi
            if c['kind']=='trend':xs.append(number(r['x']))
        if xs:assert len(xs)>=2 and all(a<b for a,b in zip(xs,xs[1:])), 'Trend x must increase'
    assert len(ids)==len(set(ids));assert s['hero']['chart'] in ids
    chart=next(c for c in s['charts'] if c['id']==s['hero']['chart']);assert chart['kind']!='trend','Hero summary needs one category or interval'
    assert 0<=s['hero'].get('row',0)<len(chart['rows'])
    return s
def table(c):
    p=c.get('precision',1);f=lambda v:f'{v:.{p}f}'
    heads=['对象','估计值','区间下限','区间上限'] if c['kind']=='interval' else ['时点' if c['kind']=='trend' else '类别','数值']
    rows=[]
    for i,r in enumerate(c['rows']):
        values=[r['label'],f(r['estimate']),f(r['low']),f(r['high'])] if c['kind']=='interval' else [r.get('label',r.get('x')),f(r['value'])]
        rows.append('<tr>'+''.join(f'<{("th" if j==0 else "td")} data-row="{i}" data-field="{j}">'+escape(v)+f'</{("th" if j==0 else "td")}>' for j,v in enumerate(values))+'</tr>')
    return '<div class="table-scroll" tabindex="0" role="region" aria-label="'+escape(c['title'])+'数表"><table class="report-table" data-source="'+c['id']+'"><caption class="sr-only">'+escape(c['unit'])+'</caption><thead><tr>'+''.join('<th scope="col">'+escape(h)+'</th>' for h in heads)+'</tr></thead><tbody>'+''.join(rows)+'</tbody></table></div>'
def svg(c,summary=None):
    suffix='-summary' if summary is not None else ''
    return f'<div class="report-plot"><svg class="report-chart" id="{c["id"]}{suffix}" data-chart="{c["id"]}"'+(f' data-summary="{summary+1}"' if summary is not None else '')+' role="img"></svg></div>'
def generate(s):
    h=s['hero'];chart=next(c for c in s['charts'] if c['id']==h['chart']);r=chart['rows'][h.get('row',0)];p=chart.get('precision',1)
    value=r.get('estimate',r.get('value'));display=f'{value:+.{p}f}' if h.get('signed') else f'{value:.{p}f}'
    ci=f'{chart["intervalLabel"]} [{r["low"]:.{p}f}, {r["high"]:.{p}f}]' if chart['kind']=='interval' else h.get('context','')
    styles=['foundation/design-tokens.css',*[f'foundation/themes/{t}.css' for t in ['apple-classic','warm-editorial','forest-minimal','graphite']],'report.css','foundation/hallmark/fonts/font-faces.css','foundation/hallmark/typography-profiles.css',*[f'foundation/hallmark/presets/{t}.css' for t in ['apple-classic','warm-editorial','forest-minimal','graphite']],'foundation/hallmark/chart-styles.css','foundation/hallmark/decorative-elements.css','foundation/hallmark/lab-controls.css','components.css','foundation/style-pack-tokens.css',*[f'foundation/style-pack-{t}.css' for t in ['pixel','cel','sunset','newspaper']]]
    links=''.join(f'<link rel="stylesheet" href="assets/{f}">\n' for f in styles)
    selectors=''.join('<label for="'+id+'"><span>'+label+'</span><select id="'+id+'">'+''.join('<option value="'+v+'">'+text+'</option>' for v,text in options)+'</select></label>' for id,label,options in [
        ('theme-picker','Base Theme',[('apple-classic','Apple Classic'),('warm-editorial','Warm Editorial'),('forest-minimal','Forest Minimal'),('graphite','Graphite')]),
        ('type-picker','Typography Profile',[('auto','Auto'),('modern-sans','Modern Sans'),('editorial','Editorial'),('humanist','Humanist'),('technical','Technical')]),
        ('style-picker','Expressive Style · 实验性',[('none','关闭'),('pixel','Pixel'),('cel','Cel Shaded'),('sunset','Sunset Retro'),('newspaper','Newspaper Editorial')])])
    body=[]
    for i,c in enumerate(s['charts']):
        body.append(f'<section class="section {"white-section" if i%2==0 else "trend-section"}" id="section-{c["id"]}" aria-labelledby="title-{c["id"]}"><div class="wrap"><div class="section-heading"><div><h2 id="title-{c["id"]}">{escape(c["title"])}</h2></div></div><figure class="chart-surface"><p class="plot-unit">{escape(c["unit"]+(" · "+c["intervalLabel"] if c.get("intervalLabel") else ""))}</p>'+svg(c)+f'<figcaption class="report-chart-note">{escape(c.get("note",""))}</figcaption></figure>'+ (table(c) if c.get('table',True) else '')+'</div></section>')
    methods=''.join('<details><summary>'+escape(m['title'])+'</summary><div class="disclosure">'+''.join('<p>'+escape(t)+'</p>' for t in m['paragraphs'])+'</div></details>' for m in s['methods'])
    data=json.dumps(s,ensure_ascii=True,allow_nan=False).replace('<','\\u003c')
    nature={'simulation':'模拟数据','observed':'观测数据','estimated':'模型估计'}[s['nature']]
    return f'''<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{escape(s['title'])}</title><script src="assets/runtime/design-controls.js"></script>{links}</head>
<body><a class="skip" href="#content">跳至主要证据</a><div class="nav-shell"><nav class="nav" aria-label="报告导航"><a class="brand" href="#home">{escape(s.get('brand','分析报告'))}</a><div class="nav-links"><a href="#content">主要证据</a><a href="#methods">方法</a></div><button class="design-toggle" id="design-toggle" popovertarget="design-controls">外观与排版 <small id="active-design"></small><small id="active-style"></small></button></nav></div>
<aside class="design-controls" id="design-controls" popover="auto" aria-label="外观与排版"><div class="controls-heading"><h2>外观与排版</h2><button popovertarget="design-controls" popovertargetaction="hide" aria-label="关闭设置">×</button></div>{selectors}<p class="report-chart-note">表达型风格为实验功能；关闭可恢复基础主题。</p><button id="reset-design">恢复默认组合</button></aside>
<main><header class="composition-hero" id="home"><div class="wrap"><div class="hero-heading"><div class="eyebrow-line"><span class="simulation">{nature}</span></div><h1>{escape(s['title'])}</h1><p class="hero-question">{escape(s['question'])}</p></div><section class="insight-panel" aria-label="核心结果"><div class="insight-result"><h2>{escape(h['label'])}</h2><p class="insight-number num"><span id="hero-value">{display}</span><span class="insight-unit">{escape(chart['unit'])}</span></p><p class="insight-ci">{escape(ci)}</p><p class="insight-context">{escape(h['boundary'])}</p></div><figure class="insight-evidence"><div class="insight-chart-heading"><h3>{escape(r['label'])}</h3></div>{svg(chart,h.get('row',0))}<figcaption>{escape(h.get('evidenceNote',chart.get('note','')))}</figcaption></figure></section></div></header>
<div id="content">{''.join(body)}</div><section class="section white-section methods-section report-methods" id="methods"><div class="wrap"><div class="section-heading"><h2>方法与统计明细</h2></div><p class="method-boundary">{escape(s['methodSummary'])}</p>{methods}</div></section></main><footer><div class="wrap"><div class="footer-line"><strong>{escape(s.get('brand','分析报告'))}</strong><span>{nature}</span></div></div></footer>
<script id="report-data" type="application/json">{data}</script><script src="assets/runtime/charts.js"></script><script src="assets/runtime/report.js"></script><script src="assets/runtime/visual-grammar.js"></script></body></html>'''
def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--spec',type=Path,required=True);parser.add_argument('--out',type=Path,required=True);a=parser.parse_args()
    s=validate(json.loads(a.spec.read_text(encoding='utf-8'),parse_constant=lambda x:(_ for _ in ()).throw(ValueError(x))))
    if a.out.exists() and any(a.out.iterdir()):raise SystemExit('Output directory must be empty; choose a new directory')
    a.out.mkdir(parents=True,exist_ok=True);shutil.copytree(ROOT/'assets',a.out/'assets',dirs_exist_ok=True)
    (a.out/'index.html').write_text(generate(s),encoding='utf-8');shutil.copyfile(a.spec,a.out/'source.json');print('Created',a.out/'index.html')
if __name__=='__main__':main()
