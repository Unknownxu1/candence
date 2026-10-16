"""Inline local CSS/JS for offline single-file reports. Reject remote runtime resources."""
from pathlib import Path
import re,argparse,json
def bundle(source):
    source=source.resolve();text=source.read_text(encoding='utf-8')
    def local(url):
        if re.match(r'^[a-z]+:|^//',url,re.I):raise ValueError('Only local runtime assets are supported: '+url)
        p=(source.parent/url).resolve()
        if not p.is_relative_to(source.parent):raise ValueError('Runtime assets must be within the report folder')
        return p.read_text(encoding='utf-8')
    def css(m):
        text=local(m.group(1))
        for ref in re.findall(r'url\(\s*[\'"]?([^\)\'"\s]+)',text):
            if not ref.startswith(('data:','#')):raise ValueError('CSS URL needs an inline data URI: '+ref)
        if '@import' in text:raise ValueError('Resolve CSS imports before bundling')
        return '<style>\n'+text+'\n</style>'
    text=re.sub(r'<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>',css,text)
    text=re.sub(r'<script\s+src="([^"]+)"\s*></script>',lambda m:'<script>\n'+local(m.group(1)).replace('</script','<\\/script')+'\n</script>',text)
    if 'data:font/' in text:
        licenses={p.relative_to(source.parent).as_posix():p.read_text(encoding='utf-8') for p in source.parent.rglob('OFL-*.txt')}
        if not licenses:raise ValueError('Bundled font data requires colocated OFL license text')
        notices=json.dumps(licenses,ensure_ascii=True).replace('<','\\u003c')
        text=text.replace('</body>','<script type="application/json" id="bundled-font-licenses">'+notices+'</script></body>')
    return text
def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('source',type=Path);p.add_argument('--out',type=Path,required=True);a=p.parse_args()
    if a.source.resolve()==a.out.resolve():raise SystemExit('Choose a new output file')
    if a.out.exists():raise SystemExit('Refusing to overwrite an existing artifact')
    result=bundle(a.source);a.out.parent.mkdir(parents=True,exist_ok=True);a.out.write_text(result,encoding='utf-8');print('Bundled',a.out)
if __name__=='__main__':main()
