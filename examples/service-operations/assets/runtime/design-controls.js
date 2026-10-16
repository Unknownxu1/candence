/* Independent visual state; never reads or writes report data. */
(() => {
 const root=document.documentElement;
 const themes=['apple-classic','warm-editorial','forest-minimal','graphite'],types=['auto','modern-sans','editorial','humanist','technical'],packs=['none','pixel','cel','sunset','newspaper'];
 const defaults={'apple-classic':'modern-sans','warm-editorial':'editorial','forest-minimal':'humanist',graphite:'technical'};
 const names={'apple-classic':'Apple Classic','warm-editorial':'Warm Editorial','forest-minimal':'Forest Minimal',graphite:'Graphite',none:'',pixel:'Pixel',cel:'Cel Shaded',sunset:'Sunset Retro',newspaper:'Newspaper'};
 const query=new URL(location.href).searchParams;
 let revision=0;
 const valid=(v,choices,fallback)=>choices.includes(v)?v:fallback;
 const state=()=>({theme:root.dataset.theme,type:root.dataset.typeChoice,style:root.dataset.stylePack});
 function attributes(s){root.dataset.theme=s.theme;root.dataset.typeChoice=s.type;root.dataset.typography=s.type==='auto'?defaults[s.theme]:s.type;root.dataset.stylePack=s.style;}
 attributes({theme:valid(query.get('theme'),themes,'apple-classic'),type:valid(query.get('type'),types,'auto'),style:valid(query.get('style'),packs,'none')});
 async function setState(patch={},updateUrl=true){
  const s={...state(),...patch};s.theme=valid(s.theme,themes,'apple-classic');s.type=valid(s.type,types,'auto');s.style=valid(s.style,packs,'none');
  root.dataset.designReady='false';attributes(s);
  for(const [id,v] of [['theme-picker',s.theme],['type-picker',s.type],['style-picker',s.style]]){const el=document.getElementById(id);if(el)el.value=v;}
  const title=document.getElementById('active-design');if(title)title.textContent=names[s.theme];
  const pack=document.getElementById('active-style');if(pack)pack.textContent=names[s.style];
  if(updateUrl){const u=new URL(location.href);for(const [k,v] of Object.entries(s))u.searchParams.set(k,v);history.replaceState(null,'',u);}
  document.dispatchEvent(new CustomEvent('hallmark:designchange',{detail:state()}));const token=++revision;await document.fonts.ready;
  if(token===revision){document.dispatchEvent(new CustomEvent('hallmark:designchange',{detail:state()}));root.dataset.designReady='true';}
 }
 window.HallmarkDesign={getState:state,setState,reset:()=>setState({theme:'apple-classic',type:'auto',style:'none'})};
 function bind(){
  for(const [id,key] of [['theme-picker','theme'],['type-picker','type'],['style-picker','style']])document.getElementById(id)?.addEventListener('change',e=>setState({[key]:e.target.value}));
  document.getElementById('reset-design')?.addEventListener('click',()=>window.HallmarkDesign.reset());
  setState({},false);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();
