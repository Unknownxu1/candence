/* Small native-SVG presentation helpers. No fitting, significance tests or business defaults. */
(() => {
 const NS='http://www.w3.org/2000/svg';
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fmt=(v,p=1)=>Number(v).toFixed(p);
 function marker(x,y){
  const pack=document.documentElement.dataset.stylePack;
  if(pack==='pixel')return `<rect class="sp-marker" x="${x-5}" y="${y-5}" width="10" height="10"/>`;
  if(pack==='newspaper')return `<path class="sp-marker" d="M${x} ${y-6}L${x+4.5} ${y}L${x} ${y+6}L${x-4.5} ${y}Z"/>`;
  return `<circle class="${pack==='none'?'selected-dot':'sp-marker'}" cx="${x}" cy="${y}" r="5"/>`;
 }
 function decorate(svg,kind){
  const pack=document.documentElement.dataset.stylePack;if(pack==='none')return;
  const id=svg.id+'-paint',d=document.createElementNS(NS,'defs'),color=kind==='bar'?'var(--chart-context)':'var(--chart-focus)';
  if(pack==='pixel')d.innerHTML=`<pattern id="${id}" width="5" height="5" patternUnits="userSpaceOnUse"><rect width="5" height="5" fill="${color}" fill-opacity=".1"/><rect x="1" y="1" width="1.5" height="1.5" fill="${color}" fill-opacity=".35"/></pattern>`;
  else if(pack==='newspaper')d.innerHTML=`<pattern id="${id}" width="5" height="5" patternUnits="userSpaceOnUse"><rect width="5" height="5" fill="${color}" fill-opacity=".09"/><path d="M0 5L5 0M-1 1L1 -1M4 6L6 4" stroke="${color}" stroke-width=".8" stroke-opacity=".4"/></pattern>`;
  else d.innerHTML=`<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${color}" stop-opacity="${kind==='bar'?1:pack==='cel'?.17:.25}"/><stop offset="1" stop-color="${color}" stop-opacity="${kind==='bar'?.75:pack==='cel'?.17:.1}"/></linearGradient>`;
  svg.prepend(d);svg.querySelectorAll('.band').forEach(el=>el.style.fill=`url(#${id})`);
  svg.querySelectorAll('.hm-bar').forEach(el=>{el.setAttribute('rx',['pixel','newspaper'].includes(pack)?'0':pack==='cel'?'2':'5');if(pack!=='cel')el.style.fill=`url(#${id})`;if(['cel','newspaper'].includes(pack))el.style.stroke='var(--text-primary)';});
 }
 function render(svg,spec){
  const w=Math.max(180,svg.parentElement.clientWidth),rows=spec.rows,kind=spec.kind,p=spec.precision??1;
  const h=kind==='trend'?300:rows.length*62+64,left=kind==='trend'?48:Math.min(140,w*.31),right=kind==='bar'?48:20,top=24,bottom=36,pw=w-left-right,ph=h-top-bottom;
  const [lo,hi]=spec.domain,x=v=>left+(v-lo)/(hi-lo)*pw;
  const desc=kind==='trend'?rows.map(r=>`${r.x}: ${fmt(r.value,p)}`).join('；'):rows.map(r=>`${r.label}: ${fmt(kind==='interval'?r.estimate:r.value,p)}${kind==='interval'?`，区间 ${fmt(r.low,p)} 至 ${fmt(r.high,p)}`:''}`).join('；');
  let content=`<title id="${svg.id}-title">${esc(spec.title)}</title><desc id="${svg.id}-desc">${esc(spec.unit)}。${esc(desc)}</desc>`;
  if(kind==='trend'){
   const xmin=rows[0].x,xmax=rows.at(-1).x,tx=v=>left+(v-xmin)/(xmax-xmin)*pw,y=v=>top+(hi-v)/(hi-lo)*ph;
   for(let i=0;i<5;i++){const v=lo+(hi-lo)*i/4;content+=`<line class="chart-grid" x1="${left}" x2="${w-right}" y1="${y(v)}" y2="${y(v)}"/><text class="chart-axis" x="${left-8}" y="${y(v)+4}" text-anchor="end">${fmt(v,p)}</text>`;}
   if(rows.every(r=>r.low!==undefined&&r.high!==undefined)){const path=rows.map((r,i)=>`${i?'L':'M'}${tx(r.x)},${y(r.high)}`).join(' ')+rows.slice().reverse().map(r=>`L${tx(r.x)},${y(r.low)}`).join(' ')+'Z';content+=`<path class="band" d="${path}"/>`;}
   content+=`<path class="curve-focus" d="${rows.map((r,i)=>`${i?'L':'M'}${tx(r.x)},${y(r.value)}`).join(' ')}"/>`;
   for(const r of rows)content+=`<text class="chart-axis" x="${tx(r.x)}" y="${h-10}" text-anchor="middle">${esc(r.x)}</text>`;
  } else {
   for(let i=0;i<5;i++){const v=lo+(hi-lo)*i/4;content+=`<line class="chart-grid" x1="${x(v)}" x2="${x(v)}" y1="${top}" y2="${h-bottom}"/><text class="chart-axis" x="${x(v)}" y="${h-10}" text-anchor="middle">${fmt(v,p)}</text>`;}
   if(spec.reference!==undefined)content+=`<line class="reference-line" x1="${x(spec.reference)}" x2="${x(spec.reference)}" y1="${top}" y2="${h-bottom}"/>`;
   rows.forEach((r,i)=>{const y=top+i*62+28;content+=`<text class="chart-axis" x="${left-12}" y="${y+4}" text-anchor="end">${esc(r.label)}</text>`;
    if(kind==='interval')content+=`<line class="hm-interval" x1="${x(r.low)}" x2="${x(r.high)}" y1="${y}" y2="${y}"/><path class="hm-interval" d="M${x(r.low)} ${y-5}V${y+5}M${x(r.high)} ${y-5}V${y+5}"/>${marker(x(r.estimate),y)}`;
    else content+=`<rect class="hm-bar" x="${x(0)}" y="${y-9}" width="${x(r.value)-x(0)}" height="18" rx="3"/><text class="chart-axis" x="${x(r.value)+8}" y="${y+4}">${fmt(r.value,p)}</text>`;
   });
  }
  svg.setAttribute('viewBox',`0 0 ${w} ${h}`);svg.style.height=h+'px';svg.innerHTML=content;decorate(svg,kind);
  svg.setAttribute('aria-labelledby',svg.id+'-title '+svg.id+'-desc');
 }
 window.HallmarkCharts={render};
})();
