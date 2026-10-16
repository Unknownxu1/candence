/* Optional paint layer: no DATA writes, coordinate transforms, or model changes. */
(() => {
  const root=document.documentElement, picker=document.getElementById('style-picker');
  const labels={none:'',pixel:'Pixel',cel:'Cel Shaded',sunset:'Sunset Retro',newspaper:'Newspaper'};
  const descriptions={
    none:'沿用基础主题的外观。',
    pixel:'方角、像素边缘与方形选点。曲线保持连续，正文使用清晰字体。',
    cel:'清晰轮廓、平涂区间与硬边阴影；数据不添加阴影。',
    sunset:'低饱和落日渐层与柔和分隔；不在数据上添加光晕。',
    newspaper:'衬线标题、精细规则线与栏位分隔；不使用做旧纹理。'
  };
  picker.value=root.dataset.stylePack;
  const baseMarker=selectionMarker, baseTrend=renderTrend, baseSupport=renderSupport;
  const summarySlots=[...document.querySelectorAll('#insight-points svg svg')].map(el=>({el,markup:el.innerHTML,fill:el.querySelector('circle').getAttribute('fill')}));
  const NS='http://www.w3.org/2000/svg';
  function pack(){return root.dataset.stylePack;}
  function defs(svg,id,kind,fill){
    const d=document.createElementNS(NS,'defs');d.dataset.styleDefs='true';
    if(kind==='pixel')d.innerHTML=`<pattern id="${id}" width="5" height="5" patternUnits="userSpaceOnUse"><rect width="5" height="5" fill="${fill}" fill-opacity=".10"/><rect x="1" y="1" width="1.5" height="1.5" fill="${fill}" fill-opacity=".35"/></pattern>`;
    if(kind==='cel')d.innerHTML=`<linearGradient id="${id}"><stop stop-color="${fill}" stop-opacity=".17"/><stop offset="1" stop-color="${fill}" stop-opacity=".17"/></linearGradient>`;
    if(kind==='sunset')d.innerHTML=`<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${fill}" stop-opacity=".25"/><stop offset="1" stop-color="${fill}" stop-opacity=".10"/></linearGradient>`;
    if(kind==='newspaper')d.innerHTML=`<pattern id="${id}" width="5" height="5" patternUnits="userSpaceOnUse"><rect width="5" height="5" fill="${fill}" fill-opacity=".07"/><path d="M-1 1 L1 -1 M0 5 L5 0 M4 6 L6 4" stroke="${fill}" stroke-width=".8" stroke-opacity=".32"/></pattern>`;
    svg.prepend(d);
  }
  selectionMarker=function(x,y){
    if(pack()==='pixel')return `<rect class="sp-marker" x="${x-6}" y="${y-6}" width="12" height="12"/>`;
    if(pack()==='cel')return `<circle class="sp-marker" cx="${x}" cy="${y}" r="6.5"/>`;
    if(pack()==='sunset')return `<g class="sp-selected" aria-hidden="true"><circle class="sp-marker" cx="${x}" cy="${y}" r="8"/><circle cx="${x}" cy="${y}" r="3.5" fill="var(--chart-focus)"/></g>`;
    if(pack()==='newspaper')return `<path class="sp-marker" d="M${x} ${y-6} L${x+4.5} ${y} L${x} ${y+6} L${x-4.5} ${y} Z"/>`;
    return baseMarker(x,y);
  };
  renderTrend=function(){
    baseTrend();if(pack()==='none')return;
    const svg=document.getElementById('trend-svg');defs(svg,'sp-ci-fill',pack(),'var(--chart-focus)');
    svg.querySelector('.band').style.fill='url(#sp-ci-fill)';
  };
  renderSupport=function(){
    baseSupport();if(!['sunset','newspaper'].includes(pack()))return;
    const svg=document.getElementById('support-svg');
    if(pack()==='sunset'){
      const d=document.createElementNS(NS,'defs');d.innerHTML='<linearGradient id="sp-support-fill" x1="0" y1="0" x2="0" y2="1"><stop stop-color="var(--chart-context)"/><stop offset="1" stop-color="var(--chart-context)" stop-opacity=".72"/></linearGradient>';svg.prepend(d);
    } else defs(svg,'sp-support-fill','newspaper','var(--chart-context)');
    svg.querySelectorAll('rect').forEach(r=>{if(!r.closest('defs'))r.style.fill='url(#sp-support-fill)';});
  };
  function summaryMarks(){
    for(const {el,markup,fill} of summarySlots){
      el.innerHTML=pack()==='pixel'?`<rect x="1" y="1" width="8" height="8" fill="${fill}"/>`
        :pack()==='newspaper'?`<path d="M5 0 L9 5 L5 10 L1 5 Z" fill="${fill}"/>`:markup;
    }
  }
  function copy(){
    document.getElementById('active-style').textContent=labels[pack()];
    const auto=root.dataset.typeChoice==='auto';
    document.getElementById('style-description').textContent=descriptions[pack()]+(['sunset','newspaper'].includes(pack())?(auto?' Auto 使用风格推荐标题字体。':' 标题沿用手动字体配置。'):'');
  }
  let revision=0;
  async function apply(updateUrl=true){
    root.dataset.styleReady='false';root.dataset.stylePack=picker.value;
    if(updateUrl){const url=new URL(location.href);url.searchParams.set('style',picker.value);history.replaceState(null,'',url);}
    copy();summaryMarks();renderTrend();renderSupport();const token=++revision;
    await document.fonts.ready;
    if(token===revision){renderTrend();renderSupport();root.dataset.styleReady='true';}
  }
  picker.addEventListener('change',()=>apply());
  for(const id of ['theme-picker','type-picker'])document.getElementById(id).addEventListener('change',copy);
  document.getElementById('reset-design').addEventListener('click',()=>{picker.value='none';apply();});
  apply(false);
})();
