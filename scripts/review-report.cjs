/* Optional small execution harness; task-specific data checks remain the caller's responsibility. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const assert=require('node:assert/strict');const {pathToFileURL}=require('node:url');
const helpers=require('./browser-review.cjs');
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const impact={
 'css-color':{data:false,visual:'local'},'css-layout':{data:false,visual:'affected'},
 'copy':{data:true,visual:'local'},'chart-js':{data:true,visual:'local'},
 'calculation':{data:true,visual:'affected'},'raw-data':{data:true,visual:'affected'},
 'theme':{data:false,visual:'affected'},'interaction':{data:false,visual:'local'},
 'full':{data:true,visual:'full'}
};
function fingerprint(options){
 const files=[...new Set([options.page,...options.dataInputs,...(options.watchFiles??[])])].sort();
 const contract={mode:options.mode??'standard',change:options.change??'full',charts:options.charts,visualTargets:options.visualTargets,deepTargets:options.deepTargets,deliverables:options.deliverables};
 return hash(files.map(f=>f+'\0'+hash(fs.readFileSync(f))).join('\n')+JSON.stringify(contract)+String(options.checkData)+String(options.checkFunctional)+String(options.ready));
}
function dataFingerprint(o){
 // Inline CSS edits can reuse A. All other HTML changes and directly linked JS invalidate it.
 const html=fs.readFileSync(o.page,'utf8').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'');
 const scripts=[...html.matchAll(/<script\b[^>]*src=["']([^"']+)["']/gi)].map(m=>m[1]);
 assert.ok(scripts.every(s=>!/^https?:/.test(s)),'Remote JS requires a task-specific dependency strategy');
 const sources=[...o.dataInputs,...scripts.map(s=>path.resolve(path.dirname(o.page),s))];
 return hash(html+'\n'+sources.map(f=>f+'\0'+hash(fs.readFileSync(f))).join('\n')+'\n'+String(o.checkData)+'\n'+(o.dataCheckId??''));
}
function plan(mode='standard',change='full'){
 assert.ok(['quick','standard','deep'].includes(mode),'Unknown execution mode');
 return {mode,change:impact[change]?change:'full',...(impact[change]??impact.full),maxVisualCorrections:2};
}
function finish(result){
 result.status=Object.values(result.gates).every(v=>v==='passed')?'complete':result.blockers.length?'blocked':'needs-visual-review';
 result.stop=result.status==='complete';return result;
}
function evidenceIntact(result){
 return result?.screenshots?.length>0&&result.screenshots.every(s=>fs.existsSync(s.file)&&hash(fs.readFileSync(s.file))===s.sha256);
}
async function review(options){
 const o={mode:'standard',change:'full',...options};
 assert.ok(o.page&&o.output&&Array.isArray(o.dataInputs)&&o.dataInputs.length,'page, output, and explicit data dependencies required');
 assert.equal(typeof o.checkData,'function','Provide a real task-specific data check');
 assert.ok(Array.isArray(o.watchFiles)&&o.watchFiles.length,'Declare all linked CSS/JS and transitive dependencies in watchFiles');
 fs.mkdirSync(o.output,{recursive:true});
 const p=plan(o.mode,o.change),current=fingerprint(o),sig=dataFingerprint(o);
 const r={mode:o.mode,plan:p,fingerprint:current,dataFingerprint:sig,corrections:o.previous?.corrections??0,stages:[],skipped:[],screenshots:[],blockers:[],gates:{data:'pending',functional:'pending',visual:'pending',delivery:'pending'},stop:false};
 if(o.previous?.stop&&Object.values(o.previous.gates).every(v=>v==='passed')&&o.previous.fingerprint===current&&evidenceIntact(o.previous))return {...o.previous,skipped:[...o.previous.skipped,'No changed dependencies and all gates already passed; stopped without rerunning'],reusedComplete:true};
 if(o.correction){
  assert.ok(o.defects?.length,'List concrete defects before a visual correction');
  if(r.corrections>=p.maxVisualCorrections){r.blockers.push('Visual correction budget exhausted; ask user whether to continue');return finish(r);}
  r.corrections++;
 }
 try{
  const reusable=!p.data&&o.previous?.gates.data==='passed'&&o.previous.dataFingerprint===sig;
  if(reusable){r.stages.push({stage:'A',status:'reused',reason:'Verified data dependencies and bindings unchanged'});}
  else {const evidence=await o.checkData();assert.ok(evidence?.passed===true&&evidence.checks?.length,'Data check must return passed:true and named checks');r.stages.push({stage:'A',status:'passed',evidence});}
  r.gates.data='passed';
 }catch(e){r.stages.push({stage:'A',status:'failed'});r.blockers.push(String(e.message));return finish(r);}
 const {chromium}=require('playwright');let browser;
 try{
  browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});r.browser=await browser.version();
  const context=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1});const page=await context.newPage(),errors=helpers.diagnostics(page);
  page.setDefaultTimeout(10000);page.setDefaultNavigationTimeout(10000);
  // Stage B must pass before the first screenshot; no retries on broken charts.
  try{
   await page.goto(pathToFileURL(o.page).href,{waitUntil:'load'});await helpers.settle(page,{ready:o.ready});
   await helpers.chartsRendered(page,o.charts);
   if(o.checkFunctional)await o.checkFunctional(page,helpers);
   await helpers.settle(page);assert.deepEqual(errors,[],'JavaScript or resource failures');
   r.gates.functional='passed';r.stages.push({stage:'B',status:'passed'});
  }catch(e){r.stages.push({stage:'B',status:'failed'});r.blockers.push(String(e.message),...errors);r.skipped.push('C skipped: functional blocker detected before screenshots');return finish(r);}
  const full=p.visual==='full';
  let targets=o.visualTargets;
  if(!targets){
   if(!full)throw Error('Declare affected visualTargets; do not silently widen a local check');
   targets=o.mode==='quick'?[{name:'desktop',width:1440,height:1000}]:[{name:'desktop',width:1440,height:1000,fullPage:true},{name:'mobile',width:390,height:844,fullPage:true}];
  }
  if(o.mode==='deep'&&o.deepTargets)targets=[...targets,...o.deepTargets];
  for(const target of targets){
   assert.ok(Number.isInteger(target.width)&&target.width>0&&Number.isInteger(target.height)&&target.height>0);
   await page.setViewportSize({width:target.width,height:target.height});await helpers.settle(page);
   await helpers.chartsRendered(page,o.charts);assert.deepEqual(errors,[],'Error after resize');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'Horizontal overflow');
   const file=path.join(o.output,`${r.screenshots.length}-${String(target.name??'view').replace(/[^a-z0-9-]/gi,'-')}.png`);
   await helpers.screenshot(page,file,{selector:target.selector,fullPage:target.fullPage});
   r.screenshots.push({file,sha256:hash(fs.readFileSync(file)),width:target.width,height:target.height,selector:target.selector??null});
  }
  assert.deepEqual(errors,[]);r.stages.push({stage:'C',status:'automated-passed',humanReview:'pending'});
  r.skipped.push('Inactive themes/style packs, printing and extra devices not requested; no full repository regression');
  const delivery=o.deliverables??[o.page];assert.ok(delivery.every(f=>fs.existsSync(f)&&fs.statSync(f).size>0));
  assert.equal(fingerprint(o),current,'Inputs changed during validation; rerun affected checks');r.gates.delivery='passed';
 }catch(e){r.blockers.push(String(e.message));}finally{if(browser)await browser.close();}
 return finish(r);
}
function completeReview(result,decision,options){
 assert.ok(result.stages.some(s=>s.stage==='C'&&s.status==='automated-passed'),'No passing screenshot run');
 assert.equal(fingerprint(options),result.fingerprint,'Report dependencies changed since screenshot capture');
 assert.ok(decision.note&&decision.reviewedFiles?.length,'Record an actual screenshot review and its scope');
 assert.deepEqual([...decision.reviewedFiles].sort(),result.screenshots.map(s=>s.file).sort(),'Review every captured view');
 for(const shot of result.screenshots)assert.equal(hash(fs.readFileSync(shot.file)),shot.sha256,'Screenshot changed after capture');
 const r=structuredClone(result);r.visualReview=decision;
 if(decision.defects?.length){r.blockers.push(...decision.defects);r.gates.visual='failed';}
 else {r.gates.visual='passed';r.stages.find(s=>s.stage==='C').humanReview='passed';}
 return finish(r);
}
module.exports={review,completeReview,plan,fingerprint,evidenceIntact};
