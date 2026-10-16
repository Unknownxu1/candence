/* Bounded browser helpers. Test-only behavior; no report runtime changes. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
async function settle(page,{ready,timeout=10000}={}){
 if(ready)await page.waitForFunction(ready,null,{timeout});
 await page.evaluate(async limit=>{
  let timer;
  try{await Promise.race([document.fonts.ready,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Font readiness timeout')),limit);})]);}
  finally{clearTimeout(timer);}
 },timeout);
 await page.evaluate(()=>{
  if(document.getElementById('cadence-review-stability'))return;
  const style=document.createElement('style');style.id='cadence-review-stability';
  style.textContent='html{scroll-behavior:auto!important}*,*::before,*::after{animation:none!important;transition:none!important}';document.head.append(style);
 });
 await page.evaluate(async()=>{
  let last='',stable=0;
  for(let i=0;i<12;i++){
   await new Promise(r=>requestAnimationFrame(r));
   const state=JSON.stringify([scrollX,scrollY,document.documentElement.scrollHeight,...[...document.querySelectorAll('svg')].map(el=>[el.innerHTML,el.getBoundingClientRect().width,el.getBoundingClientRect().height])]);
   stable=state===last?stable+1:0;last=state;if(stable>=2)return;
  }
  throw Error('Layout/chart state did not stabilize within bounded frame sampling');
 });
}
function diagnostics(page){
 const errors=[];
 page.on('pageerror',e=>errors.push('pageerror: '+e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text());});
 page.on('requestfailed',r=>{if(r.failure()?.errorText!=='net::ERR_ABORTED')errors.push('resource: '+r.url());});
 page.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+': '+r.url());});
 return errors;
}
async function chartsRendered(page,charts){
 assert.ok(charts.length,'Declare expected charts and data-mark selectors');
 for(const chart of charts){
  const containers=page.locator(chart.selector);assert.ok(await containers.count(),'Missing chart '+chart.selector);
  for(const el of await containers.all()){
   const state=await el.evaluate((node,rule)=>{
    const box=node.getBoundingClientRect();
    const marks=[...node.querySelectorAll(rule.marks)].filter(m=>!m.closest('defs'));
    return {width:box.width,height:box.height,marks:marks.map(m=>{
     const style=getComputedStyle(m),b=m.getBBox?.()??m.getBoundingClientRect();
     const invalid=[...m.attributes].some(a=>/\b(?:NaN|Infinity)\b/.test(a.value));
     return {visible:style.display!=='none'&&style.visibility!=='hidden'&&+style.opacity!==0,extent:b.width+b.height,invalid};
    })};
   },chart);
   assert.ok(state.width>0&&state.height>0,'Zero-size chart '+chart.selector);
   assert.ok(state.marks.length>=(chart.minMarks??1),'Empty data marks '+chart.selector);
   assert.ok(state.marks.every(m=>m.visible&&m.extent>0&&!m.invalid),'Invalid/invisible data geometry '+chart.selector);
  }
 }
}
async function popover(page,selector,open){
 const node=page.locator(selector);assert.equal(await node.count(),1);
 await node.evaluate((el,want)=>{if(el.matches(':popover-open')!==want){if(want)el.showPopover();else el.hidePopover();}},open);
 assert.equal(await node.evaluate(el=>el.matches(':popover-open')),open);
}
async function screenshot(page,file,{selector,fullPage=false}={}){
 await settle(page);
 if(selector){const el=page.locator(selector);assert.equal(await el.count(),1);await el.scrollIntoViewIfNeeded();await settle(page);const b=await el.boundingBox();assert.ok(b&&b.width>0&&b.height>0,'Invalid screenshot target');await el.screenshot({path:file,animations:'disabled'});}
 else {await page.evaluate(()=>scrollTo({top:0,left:0,behavior:'instant'}));await page.screenshot({path:file,fullPage,animations:'disabled'});}
 assert.ok(fs.statSync(file).size>0);
}
module.exports={settle,diagnostics,chartsRendered,popover,screenshot};
