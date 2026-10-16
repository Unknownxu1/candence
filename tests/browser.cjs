const {chromium}=require('playwright');const AxeBuilder=require('@axe-core/playwright').default;
const path=require('path'),fs=require('fs'),assert=require('assert/strict');
const reviewHelpers=require('../scripts/browser-review.cjs');
const root=path.resolve(__dirname,'..'),out=process.env.CADENCE_TEST_OUTPUT??path.join(root,'tests/artifacts');fs.mkdirSync(out,{recursive:true});
const cases=['causal-inference','rank-logit','service-operations'];
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
 const context=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1});const page=await context.newPage(),errors=[],requests=[],failed=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text().slice(0,500));});page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});page.on('requestfailed',r=>{if(r.failure()?.errorText!=='net::ERR_ABORTED')failed.push({url:r.url().slice(0,180),error:r.failure()?.errorText});});
 const ready=()=>reviewHelpers.settle(page,{ready:()=>document.documentElement.dataset.designReady==='true'&&document.documentElement.dataset.styleReady!=='false'});
 const goto=async(name,query='')=>{await page.goto('file:///'+path.join(root,'examples',name,'index.html').replaceAll('\\','/')+query);await ready();};
 const records=[];
 const snap=async name=>{await reviewHelpers.screenshot(page,path.join(out,name+'-first.png'));await reviewHelpers.screenshot(page,path.join(out,name+'-full.png'),{fullPage:true});};
 const chartData=()=>page.evaluate(()=>[...document.querySelectorAll('svg[data-chart],#trend-svg')].map(s=>({id:s.id,viewBox:s.getAttribute('viewBox'),d:[...s.querySelectorAll('.curve-focus,.band,path.hm-interval')].map(p=>p.getAttribute('d')),intervals:[...s.querySelectorAll('line.hm-interval')].map(r=>['x1','x2','y1','y2'].map(a=>r.getAttribute(a))),rows:[...s.querySelectorAll('.hm-bar')].map(r=>['x','y','width','height'].map(a=>r.getAttribute(a)))})));
 for(const name of cases){
  await page.setViewportSize({width:1440,height:1000});await goto(name);const baseData=await page.evaluate(()=>document.getElementById('report-data')?JSON.parse(document.getElementById('report-data').textContent):DATA);
  const record={name,widths:[],designStates:0};
  if(name!=='rank-logit'){
   const source=JSON.parse(fs.readFileSync(path.join(root,'examples',name,'source.json'),'utf8'));assert.deepEqual(baseData,source);
   for(const c of source.charts){const cells=await page.locator(`table[data-source="${c.id}"] tbody tr`).allTextContents();assert.equal(cells.length,c.rows.length);for(let i=0;i<c.rows.length;i++){const row=c.rows[i],digits=c.precision??1;const values=c.kind==='interval'?[row.estimate,row.low,row.high]:[row.value];for(let j=0;j<values.length;j++)assert.equal(await page.locator(`table[data-source="${c.id}"] [data-row="${i}"][data-field="${j+1}"]`).textContent(),values[j].toFixed(digits));}}
   // The supplied data define marker/CI/bar positions, not merely table text.
   for(const c of source.charts){const actual=await page.locator(`svg#${c.id}`).evaluate((s,c)=>{const w=s.viewBox.baseVal.width,left=c.kind==='trend'?48:Math.min(140,w*.31),right=c.kind==='bar'?48:20;const x=v=>left+(v-c.domain[0])/(c.domain[1]-c.domain[0])*(w-left-right);if(c.kind==='interval')return [...s.querySelectorAll('line.hm-interval')].map((e,i)=>({actual:[+e.getAttribute('x1'),+e.getAttribute('x2')],expected:[x(c.rows[i].low),x(c.rows[i].high)]}));if(c.kind==='bar')return [...s.querySelectorAll('.hm-bar')].map((e,i)=>({actual:[+e.getAttribute('width')],expected:[x(c.rows[i].value)-x(0)]}));return [];},c);for(const r of actual)r.actual.forEach((v,i)=>assert.ok(Math.abs(v-r.expected[i])<1e-7));}
  } else {
   assert.deepEqual(baseData,JSON.parse(fs.readFileSync(path.join(root,'examples/rank-logit/data/analysis.json'),'utf8')));assert.equal(await page.locator('#hero-effect').textContent(),(baseData.models.find(m=>m.id==='spline').contrast12vs0.estimate<0?'−':'+')+Math.abs(baseData.models.find(m=>m.id==='spline').contrast12vs0.estimate).toFixed(1));
   await page.locator('[data-model="linear"]').click();await page.locator('#distribution-month').selectOption('18');assert.equal(await page.locator('#month-slider').inputValue(),'18');await page.locator('#compare-models').check();
   const event=page.waitForEvent('download');await page.locator('#export-csv').click();const d=await event;const dest=path.join(out,'rank-export.csv');await d.saveAs(dest);assert.equal(fs.readFileSync(dest,'utf8').trim().split(/\r?\n/).length,26);await goto(name);
  }
  await reviewHelpers.chartsRendered(page,name==='rank-logit'?[{selector:'#trend-svg',marks:'.curve-focus'}]:[{selector:'svg[data-chart]',marks:'.hm-bar,.curve-focus,.hm-interval'}]);
  assert.deepEqual(errors,[],'Block screenshots when functional errors exist');const geometry=await chartData();await snap(name);
  for(const width of [1440,768,390,320]){await page.setViewportSize({width,height:width===390?844:1000});await ready();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,name+'/'+width);record.widths.push(width);if(width===390){await snap(name+'-mobile');}}
  await page.setViewportSize({width:1440,height:1000});await ready();
  for(const theme of ['apple-classic','warm-editorial','forest-minimal','graphite'])for(const type of ['auto','editorial']){
   await page.locator('#design-toggle').click();await page.locator('#theme-picker').selectOption(theme);await page.locator('#type-picker').selectOption(type);await page.keyboard.press('Escape');await ready();record.designStates++;assert.deepEqual(await chartData(),geometry);assert.deepEqual(await page.evaluate(()=>document.getElementById('report-data')?JSON.parse(document.getElementById('report-data').textContent):DATA),baseData);
  }
  for(const pack of ['none','pixel','cel','sunset','newspaper']){
   await page.locator('#design-toggle').click();await page.locator('#style-picker').selectOption(pack);await page.keyboard.press('Escape');await ready();assert.deepEqual(await chartData(),geometry);record.designStates++;
   if(pack==='newspaper')await snap(name+'-newspaper');
  }
  await page.locator('details summary').first().click();await page.locator('#design-toggle').click();await page.locator('#reset-design').click();await ready();assert.ok(await page.locator('details').first().evaluate(d=>d.open));assert.equal(await page.locator('#style-picker').inputValue(),'none');assert.equal(await page.locator('#theme-picker').inputValue(),'apple-classic');assert.equal(await page.locator('#type-picker').inputValue(),'auto');await page.keyboard.press('Escape');
  await page.evaluate(()=>scrollTo({top:document.querySelector('#methods').offsetTop-120,behavior:'instant'}));await ready();await page.screenshot({path:path.join(out,name+'-methods.png')});
  const axe=await new AxeBuilder({page}).options({preload:false}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();record.axe=axe.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}));assert.deepEqual(record.axe,[],name+' axe');
  await page.emulateMedia({media:'print'});await page.pdf({path:path.join(out,name+'-print.pdf'),printBackground:true,preferCSSPageSize:true});await page.emulateMedia({media:'screen'});
  // Force unavailable preferred fonts and remove custom face declarations: simulated fallback.
  await page.addStyleTag({content:':root {--font-display:"Missing Hallmark Face",Arial,"Microsoft YaHei",sans-serif!important;--font-heading:Arial,"Microsoft YaHei",sans-serif!important;--font-reading:Arial,"Microsoft YaHei",sans-serif!important;--font-numerals:Arial,sans-serif!important;}'});
  await page.setViewportSize({width:390,height:844});await ready();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await snap(name+'-fallback');record.fallbackSimulated=true;
  records.push(record);console.log(name,'passed');
 }
 console.log('Checking single-file artifact');await page.setViewportSize({width:1440,height:1000});await page.goto('file:///'+path.join(root,'examples/causal-inference/standalone.html').replaceAll('\\','/'));await ready();assert.equal(await page.locator('#hero-value').textContent(),'+3.6');assert.equal(await page.locator('#bundled-font-licenses').evaluate(el=>Object.keys(JSON.parse(el.textContent)).length),2);await snap('single-file');
 // Run the actual generated report from a relocated folder with no repository asset paths.
 console.log('Checking relocated folder');const relocated=path.join(out,'relocated-service');
 const copyTree=(src,dest)=>{fs.mkdirSync(dest,{recursive:true});for(const entry of fs.readdirSync(src,{withFileTypes:true})){const from=path.join(src,entry.name),to=path.join(dest,entry.name);if(entry.isSymbolicLink())throw new Error('Unexpected symlink in fixture');if(entry.isDirectory())copyTree(from,to);else fs.copyFileSync(from,to);}};
 copyTree(path.join(root,'examples/service-operations'),relocated);await page.goto('file:///'+path.join(relocated,'index.html').replaceAll('\\','/'));await ready();assert.equal(await page.locator('#hero-value').textContent(),'280');await snap('relocated-service');
 // The Golden filename now contains an independently built fictional sales report.
 await page.goto('file:///'+path.join(root,'examples/golden-first.html').replaceAll('\\','/'));await ready();
 for(const width of [1440,390]){await page.setViewportSize({width,height:width===390?844:1000});await ready();assert.equal(await page.locator('#hero-value').textContent(),'280');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:path.join(out,width===1440?'golden-first.png':'golden-mobile.png'),fullPage:width===390});}
 assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);assert.deepEqual(failed,[]);
 const result={browser:await browser.version(),node:process.version,viewport:{width:1440,height:1000,deviceScaleFactor:1},records,errors,networkRequests:requests,failedRequests:failed,singleFileRendered:true,relocatedOutputRendered:true,dataValuesAndGeometryChecked:true,themeFontAndStyleSwitching:true,sourceCopyUnmodified:true};fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify(result,null,2));await browser.close();console.log('Browser validation passed');
})().catch(e=>{fs.writeFileSync(path.join(out,'browser-error.txt'),String(e.stack));console.error(String(e.stack).slice(0,2000));setTimeout(()=>process.exit(1),100);});
