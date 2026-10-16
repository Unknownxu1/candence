/* Bind declarative presentation only. DATA and report-specific analysis remain external. */
(() => {
 const spec=JSON.parse(document.getElementById('report-data').textContent);
 const redraw=()=>document.querySelectorAll('[data-chart]').forEach(svg=>{
  const chart=spec.charts.find(c=>c.id===svg.dataset.chart);const display=svg.dataset.summary?{...chart,rows:[chart.rows[Number(svg.dataset.summary)-1]]}:chart;
  HallmarkCharts.render(svg,display);
 });
 document.addEventListener('hallmark:designchange',redraw);
 new ResizeObserver(()=>redraw()).observe(document.querySelector('.wrap'));
 let opened=[];
 window.addEventListener('beforeprint',()=>{opened=[...document.querySelectorAll('details')].map(d=>d.open);document.querySelectorAll('details').forEach(d=>d.open=true);redraw();});
 window.addEventListener('afterprint',()=>{document.querySelectorAll('details').forEach((d,i)=>d.open=opened[i]);redraw();});
 redraw();
})();
