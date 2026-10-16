/* Real browser tests on temporary copies of public synthetic fixtures, never on Golden. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const {review,completeReview,plan,evidenceIntact}=require('../scripts/review-report.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(__dirname,'artifacts/execution');fs.mkdirSync(out,{recursive:true});
function copy(src,dest){fs.mkdirSync(dest,{recursive:true});for(const e of fs.readdirSync(src,{withFileTypes:true})){assert.ok(!e.isSymbolicLink());const s=path.join(src,e.name),d=path.join(dest,e.name);if(e.isDirectory())copy(s,d);else fs.copyFileSync(s,d);}}
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const summary={cases:{},limits:[],screenshotsReviewedByTest:false};
let generationRuns=0,dataRuns=0;
function reportOptions(report){
 const page=path.join(report,'index.html'),source=path.join(report,'source.json');
 return {page,dataInputs:[source],watchFiles:files(path.join(report,'assets')),output:path.join(out,'C-standard'),
  charts:[{selector:'svg[data-chart]',marks:'.hm-bar,.curve-focus'}],
  ready:()=>document.documentElement.dataset.designReady==='true',
  checkData:async()=>{
   dataRuns++;const spec=JSON.parse(fs.readFileSync(source,'utf8'));
   assert.equal(spec.nature,'simulation');assert.equal(spec.charts[0].rows.reduce((n,r)=>n+r.value,0),720);assert.equal(spec.charts[1].rows.reduce((n,r)=>n+r.value,0),720);
   const match=fs.readFileSync(page,'utf8').match(/<script id="report-data" type="application\/json">([\s\S]*?)<\/script>/);assert.deepEqual(JSON.parse(match[1]),spec);
   return {passed:true,checks:['fictional source declared','flavor and weekly totals each 720','embedded payload equals source']};
  },
  checkFunctional:async(p,h)=>{
   assert.equal(await p.locator('#cadence-review-stability').count(),1,'Stability style must be installed only once');
   const spec=JSON.parse(fs.readFileSync(source,'utf8'));assert.equal(await p.locator('#hero-value').textContent(),'280');
   for(const c of spec.charts)for(let i=0;i<c.rows.length;i++)assert.equal(await p.locator(`table[data-source="${c.id}"] [data-row="${i}"][data-field="1"]`).textContent(),String(c.rows[i].value));
   await h.popover(p,'#design-controls',true);await h.popover(p,'#design-controls',true);await h.popover(p,'#design-controls',false);
   const details=p.locator('details').first();await details.locator('summary').click();assert.ok(await details.evaluate(el=>el.open));await details.locator('summary').click();
  }};
}
const run=async()=>{
 // Case C builds a NEW report once through the existing public generator.
 const report=path.join(out,'report-'+Date.now());
 const generated=spawnSync(process.env.PYTHON_EXECUTABLE??'python',[path.join(root,'scripts/create_report.py'),'--spec',path.join(root,'tests/fixtures/service-operations.json'),'--out',report],{encoding:'utf8'});
 assert.equal(generated.status,0,generated.stderr);generationRuns++;
 const base=reportOptions(report),page=base.page,source=path.join(report,'source.json');
 const c=await review(base);assert.equal(c.mode,'standard');assert.deepEqual(c.stages.map(s=>s.stage),['A','B','C']);assert.equal(c.status,'needs-visual-review');assert.equal(c.corrections,0);assert.equal(c.screenshots.length,2);
 assert.equal(c.stop,false,'Automated checks cannot claim manual visual approval');
 assert.ok(evidenceIntact(c));assert.equal(evidenceIntact({...c,screenshots:[{file:path.join(out,'missing.png'),sha256:'none'}]}),false);
 assert.equal(evidenceIntact({...c,screenshots:[{...c.screenshots[0],sha256:'tampered'}]}),false);
 // Simulate the approval interface only for lifecycle tests. Actual inspection is recorded separately.
 const simulated=completeReview(c,{reviewedFiles:c.screenshots.map(s=>s.file),note:'TEST FIXTURE: simulated sign-off for state-machine testing; not a human visual inspection',defects:[]},base);
 assert.ok(simulated.stop);const stopped=await review({...base,previous:simulated});assert.ok(stopped.reusedComplete);assert.equal(dataRuns,1);
 summary.cases.C={mode:c.mode,stages:c.stages,initialStatus:c.status,simulatedGateStatus:simulated.status,stoppedWithoutRerun:stopped.reusedComplete,generationRuns,screenshots:c.screenshots,corrections:c.corrections};
 fs.writeFileSync(path.join(out,'C-pending.json'),JSON.stringify(c,null,2));
 // Case A: modify only a CSS color in an isolated report copy; no data generation.
 const css=path.join(report,'assets/components.css');fs.appendFileSync(css,'\n.report-chart-note{color:#4b5563}\n');const before=dataRuns;
 const a=await review({...base,mode:'quick',change:'css-color',previous:simulated,output:path.join(out,'A-css'),visualTargets:[{name:'local-chart',width:1440,height:1000,selector:'#content > section:first-child .wrap'}]});
 assert.equal(a.stages[0].status,'reused');assert.equal(dataRuns,before);assert.equal(generationRuns,1);assert.equal(a.screenshots.length,1);assert.equal(a.blockers.length,0);
 summary.cases.A={stages:a.stages,dataRuns:0,generationRuns:0,screenshots:a.screenshots,skipped:a.skipped};
 // Case B: inject a controlled broken function reference; B must block every screenshot.
 const js=path.join(report,'assets/runtime/report.js'),original=fs.readFileSync(js,'utf8');fs.writeFileSync(js,'throw new Error("Controlled chart function reference failure");\n');
 const b=await review({...base,change:'chart-js',previous:a,output:path.join(out,'B-broken'),visualTargets:[{name:'chart',width:1440,height:1000,selector:'#content > section:first-child .wrap'}]});
 assert.equal(b.status,'blocked');assert.equal(b.screenshots.length,0);assert.equal(b.stages.at(-1).stage,'B');assert.ok(b.skipped.some(s=>s.startsWith('C skipped')));
 fs.writeFileSync(js,original);
 const fixed=await review({...base,change:'chart-js',previous:b,output:path.join(out,'B-fixed'),visualTargets:[{name:'chart-fixed',width:1440,height:1000,selector:'#content > section:first-child .wrap'}]});
 assert.equal(fixed.blockers.length,0);assert.equal(fixed.screenshots.length,1);assert.deepEqual(fixed.stages.map(s=>s.stage),['A','B','C']);
 summary.cases.B={failureStages:b.stages,blockers:b.blockers,screenshotsBeforeFix:0,skipped:b.skipped,repairStages:fixed.stages,screenshotsAfterFix:fixed.screenshots,fullRegressionRun:false};
 // Revisions are bounded, and changed data cannot reuse a CSS-only data result.
 const exhausted=await review({...base,previous:{...fixed,corrections:2},correction:true,defects:['Controlled overlap blocker']});assert.equal(exhausted.status,'blocked');assert.equal(exhausted.screenshots.length,0);
 await assert.rejects(()=>review({...base,previous:fixed,correction:true,defects:[]}),/concrete defects/);
 const spec=JSON.parse(fs.readFileSync(source,'utf8'));spec.charts[0].rows[0].value++;fs.writeFileSync(source,JSON.stringify(spec));
 const invalid=await review({...base,change:'css-color',previous:a});assert.equal(invalid.stages[0].stage,'A');assert.equal(invalid.stages[0].status,'failed');assert.equal(invalid.screenshots.length,0);
 fs.writeFileSync(source,JSON.stringify(JSON.parse(fs.readFileSync(path.join(root,'tests/fixtures/service-operations.json'),'utf8')),null,2));
 // Restore exact original source bytes so the pending C review remains content-addressed.
 fs.copyFileSync(path.join(root,'tests/fixtures/service-operations.json'),source);
 fs.writeFileSync(css,fs.readFileSync(path.join(root,'assets/components.css')));
 assert.deepEqual(plan(undefined,'unknown').mode,'standard');assert.equal(plan('deep','unknown').change,'full');
 summary.limits=['2 visual corrections maximum verified','empty defect list rejected','changed source invalidates A cache and blocks B/C','inactive themes not tested by report harness'];
 // Keep portable paths in the tracked evidence; absolute paths remain only in ignored run artifacts.
 fs.writeFileSync(path.join(out,'report-options.json'),JSON.stringify({report,files:base.watchFiles},null,2));
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(summary,null,2));console.log('Execution cases A/B/C and guards passed. Actual screenshot inspection still required.');
};
module.exports={reportOptions};
if(require.main===module)run().catch(e=>{console.error(e.stack);process.exitCode=1;});
