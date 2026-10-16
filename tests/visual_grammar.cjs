/* Small reusable browser contract test; no reports, screenshots, or records are written. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');const root=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
 try{
  const page=await browser.newPage();
  await page.setContent('<html data-style-pack="none"><body><h1>不同长度的中文与 English 2026</h1><svg width="320" height="120"><path class="curve-focus" d="M10 80 C90 10 200 110 310 20"/><line class="hm-interval" x1="40" x2="180" y1="60" y2="60"/><circle class="selected-dot" cx="110.25" cy="55.75" r="5"/></svg></body></html>');
  await page.addStyleTag({content:fs.readFileSync(path.join(root,'assets/foundation/style-pack-pixel.css'),'utf8')});
  await page.addScriptTag({path:path.join(root,'assets/runtime/visual-grammar.js')});
  const geometry=await page.locator('svg').innerHTML();
  await page.locator('circle').evaluate(el=>{window.pointClicks=0;el.addEventListener('click',()=>window.pointClicks++);});
  for(let i=0;i<3;i++){
   await page.evaluate(()=>{document.documentElement.dataset.stylePack='pixel';CadenceGrammar.refresh();});
   assert.equal(await page.locator('[data-vg-generated]').count(),1);
   const point=await page.locator('[data-vg-generated]').evaluate(el=>({x:+el.getAttribute('x'),y:+el.getAttribute('y'),w:+el.getAttribute('width'),h:+el.getAttribute('height')}));
   assert.equal(point.x+point.w/2,110.25);assert.equal(point.y+point.h/2,55.75);
   assert.equal(await page.locator('.curve-focus').getAttribute('d'),'M10 80 C90 10 200 110 310 20');
   await page.locator('circle').click();assert.equal(await page.evaluate(()=>window.pointClicks),i+1);
   await page.evaluate(()=>{document.documentElement.dataset.stylePack='none';CadenceGrammar.refresh();});
   assert.equal(await page.locator('svg').innerHTML(),geometry);
  }
  await page.evaluate(()=>{document.documentElement.dataset.stylePack='pixel';CadenceGrammar.refresh();const point=document.querySelector('circle');point.setAttribute('cx','125.625');point.setAttribute('cy','65.125');point.setAttribute('r','4');});
  await page.waitForFunction(()=>Number(document.querySelector('[data-vg-generated]').getAttribute('x'))===121.625);
  assert.equal(await page.locator('[data-vg-generated]').getAttribute('y'),'61.125');
  await page.evaluate(()=>{const point=document.querySelector('circle');point.setAttribute('cx','110.25');point.setAttribute('cy','55.75');point.setAttribute('r','5');CadenceGrammar.refresh();CadenceGrammar.setEnabled(false);});
  assert.equal(await page.locator('svg').innerHTML(),geometry);
  await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>CadenceGrammar.setEnabled(true));
  await page.evaluate(()=>CadenceGrammar.disconnect());assert.equal(await page.locator('svg').innerHTML(),geometry);
  console.log('Visual Grammar contract passed: exact centers, continuous paths, reversible state, disabled adapter fallback.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
