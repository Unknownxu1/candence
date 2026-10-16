/* Optional visual-only adaptation. No analytical fields, scales, paths or model state. */
(() => {
 const root=document.documentElement,NS='http://www.w3.org/2000/svg';
 const originals=new Map();let enabled=true,scheduled=false;
 const active=()=>enabled&&root.dataset.stylePack==='pixel';
 function restore(){
  for(const [node,record] of originals){
   if(record.style===null)node.removeAttribute('style');else node.setAttribute('style',record.style);
   record.mark.remove();
  }
  originals.clear();
 }
 function refresh(){
  scheduled=false;
  if(!active()){restore();return;}
  for(const [node,record] of originals)if(!node.isConnected){record.mark.remove();originals.delete(node);}
  document.querySelectorAll('svg circle[data-vg-point],svg circle.selected-dot,.insight-point svg circle').forEach(node=>{
   if(node.closest('defs'))return;
   const x=Number(node.getAttribute('cx')),y=Number(node.getAttribute('cy')),r=Number(node.getAttribute('r'));
   if(![x,y,r].every(Number.isFinite)||r<=0)return;
   const existing=originals.get(node);
   if(existing){
    existing.mark.setAttribute('x',String(x-r));existing.mark.setAttribute('y',String(y-r));existing.mark.setAttribute('width',String(2*r));existing.mark.setAttribute('height',String(2*r));
    if(node.hasAttribute('fill'))existing.mark.style.fill=node.getAttribute('fill');
    return;
   }
   const mark=document.createElementNS(NS,'rect');
   mark.setAttribute('x',String(x-r));mark.setAttribute('y',String(y-r));mark.setAttribute('width',String(2*r));mark.setAttribute('height',String(2*r));
   mark.setAttribute('class','vg-pixel-point');mark.setAttribute('data-vg-generated','point');mark.setAttribute('aria-hidden','true');mark.style.pointerEvents='none';
   if(node.hasAttribute('fill'))mark.style.fill=node.getAttribute('fill');
   const style=node.getAttribute('style');originals.set(node,{style,mark});node.setAttribute('style',(style??'')+';opacity:0');node.after(mark);
  });
 }
 function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(refresh);}}
 const observer=new MutationObserver(mutations=>{
  if(mutations.some(m=>m.type==='childList'||m.target===root||originals.has(m.target)))schedule();
 });
 observer.observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['data-style-pack','cx','cy','r','fill']});
 document.addEventListener('hallmark:designchange',schedule);
 window.CadenceGrammar={refresh,setEnabled(value){enabled=Boolean(value);refresh();},disconnect(){observer.disconnect();document.removeEventListener('hallmark:designchange',schedule);enabled=false;restore();}};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh,{once:true});else refresh();
})();
