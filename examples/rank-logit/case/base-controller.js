/* Both axes are independent. State changes preserve statistical controls. */
(() => {
 const root=document.documentElement, theme=document.getElementById('theme-picker'), type=document.getElementById('type-picker');
 const titles={'apple-classic':'Apple Classic','warm-editorial':'Warm Editorial','forest-minimal':'Forest Minimal','graphite':'Graphite'};
 const names={'modern-sans':'Modern Sans',editorial:'Editorial',humanist:'Humanist',technical:'Technical'};
 const descriptions={
  'apple-classic':'中性灰白与蓝色重点，不透明内容表面，清晰低噪声的图表。',
  'warm-editorial':'暖纸白与陶土色，细线分节，空心点标记。',
  'forest-minimal':'自然白与森林绿，轻柔曲线和置信带，少量有机线条。',
  graphite:'冷灰与蓝灰，精细网格、菱形标记和清楚的表面边界。'
 };
 theme.value=root.dataset.theme; type.value=root.dataset.typeChoice;
 let revision=0;
 async function applyDesign(updateUrl=true) {
  root.dataset.theme=theme.value;root.dataset.typeChoice=type.value;
  root.dataset.typography=type.value==='auto'?DEFAULT_TYPES[theme.value]:type.value;
  document.getElementById('active-design').textContent=titles[theme.value];
  document.getElementById('design-description').textContent=descriptions[theme.value]+' 当前字体：'+names[root.dataset.typography]+(type.value==='auto'?'（随主题推荐）。':'（独立选择）。');
  if(updateUrl){const u=new URL(location.href);u.searchParams.set('theme',theme.value);u.searchParams.set('type',type.value);history.replaceState(null,'',u);}
  const token=++revision;renderTrend();renderSupport();await document.fonts.ready;
  if(token===revision){renderTrend();renderSupport();root.dataset.designReady='true';}
 }
 theme.addEventListener('change',()=>applyDesign());type.addEventListener('change',()=>applyDesign());
 document.getElementById('reset-design').addEventListener('click',()=>{theme.value='apple-classic';type.value='auto';applyDesign();});
 applyDesign(false);
})();
