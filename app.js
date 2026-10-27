(() => {
'use strict';
const $ = s => document.querySelector(s);
const esc = v => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = n => typeof n === 'number' ? n.toLocaleString('zh-CN') : n;
const glyphs = {
 ship:'<path d="M4 13l8-4 8 4-2 6H6zM8 11V5h8v6M12 5V2M2 21q3-3 6 0 4-3 8 0 3-3 6 0"/>',
 truck:'<path d="M2 6h12v11H2zM14 10h4l4 4v3h-8"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
 crane:'<path d="M6 21V3h13M3 21h6M6 6l13-3M17 3v9m-2 0a2 2 0 1 0 4 0M6 10l6-6"/>',
 forklift:'<path d="M3 9h9v8H3zM6 9V5h5M15 4v15h6M18 4v12h3"/><circle cx="5" cy="19" r="2"/><circle cx="11" cy="19" r="2"/>',
 camera:'<path d="M3 7h13v11H3zM16 11l5-3v10l-5-3M7 7l1-3h4l1 3"/>',
 gate:'<path d="M4 21V4h16v17M9 21V9h6v12M4 6h16M12 12v3"/>',
 area:'<path d="M3 6l9-4 9 4v12l-9 4-9-4zM3 6l9 4 9-4M12 10v12"/>',
 bolt:'<path d="M13 2L4 14h7l-1 8 10-13h-8z"/>',
 shield:'<path d="M12 2l8 4v6c0 5-8 10-8 10S4 17 4 12V6zM8 12l3 3 5-6"/>',
 chart:'<path d="M3 3v18h18M7 16v-5M12 16V6M17 16V9"/>',
 palette:'<circle cx="12" cy="12" r="9"/><circle cx="8" cy="9" r="1"/><circle cx="13" cy="7" r="1"/><circle cx="17" cy="11" r="1"/><path d="M9 20c-2-4 0-6 4-5 4 1 5-1 7-3"/>',
 settings:'<path d="M10 3h4l.6 2.5 2.2 1.3 2.5-.7 2 3.5-1.9 1.8v2.6l1.9 1.8-2 3.5-2.5-.7-2.2 1.3L14 23h-4l-.6-2.5-2.2-1.3-2.5.7-2-3.5 1.9-1.8V12L2.7 10.2l2-3.5 2.5.7 2.2-1.3z" transform="translate(0 -1) scale(1 .96)"/><circle cx="12" cy="12" r="3.2"/>',
 expand:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
 plus:'<path d="M5 12h14M12 5v14"/>', minus:'<path d="M5 12h14"/>',
 reset:'<path d="M4 9a8 8 0 1 1 0 7M4 3v6h6"/>', close:'<path d="M6 6l12 12M18 6L6 18"/>',
 arrow:'<path d="M5 12h14m-5-5l5 5-5 5"/>', play:'<path d="M8 4l12 8-12 8z"/>',
 layers:'<path d="M2 8l10-6 10 6-10 6zM2 13l10 6 10-6M2 18l10 6 10-6"/>',
 pause:'<path d="M8 5v14M16 5v14"/>', info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>'
};
const icon = n => `<svg class="od-icon" viewBox="0 0 24 24" aria-hidden="true">${glyphs[n]||glyphs.area}</svg>`;
document.querySelectorAll('[data-icon]').forEach(el => el.innerHTML = icon(el.dataset.icon));
let toastTimer;
function toast(message){$('#toast').textContent=message;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,3000);}
const days=['10/16','10/17','10/18','10/19','10/20','10/21','10/22'];
const metrics = rows => `<div class="metrics" style="--cols:${Math.min(rows.length,3)}">${rows.map(([label,value,unit=''])=>`<div class="metric od-stat"><span class="metric-label">${label}</span><strong class="metric-value od-nowrap">${fmt(value)}<small>${unit}</small></strong></div>`).join('')}</div>`;
let chartSerial=0;
function lineChart(values, values2, labels=days, names=['入场人数','作业人员']){
 const chartId='chart-fill-'+(++chartSerial);
 const max=Math.ceil(Math.max(...values,...(values2||[]))*1.15/10)*10, n=values.length;
 const pts=v=>v.map((x,i)=>[32+i*308/(n-1),94-x/max*73]);
 const p=pts(values), q=values2?pts(values2):[];
 const path=v=>v.map((a,i)=>(i?'L':'M')+a.join(',')).join(' ');
 return `<svg class="chart" viewBox="0 0 370 124" role="img" aria-label="${esc(names.join('与'))}趋势，${esc(values.join('、'))}"><title>${esc(names[0])}趋势（演示）</title><defs><linearGradient id="${chartId}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--person-series-0)" stop-opacity=".13"/><stop offset="1" stop-color="var(--person-series-0)" stop-opacity=".005"/></linearGradient></defs>${[0,.5,1].map(x=>`<line class="gridline" x1="32" y1="${94-x*73}" x2="340" y2="${94-x*73}"/><text x="0" y="${98-x*73}" style="font-size:10px">${Math.round(max*x)}</text>`).join('')}<path d="${path(p)} L340,94 L32,94 Z" fill="url(#${chartId})"/><path class="line-a" d="${path(p)}"/>${q.length?`<path class="line-b" d="${path(q)}"/>`:''}${p.map(([x,y],i)=>`<g data-tip="${esc(labels[i]+'\n'+names[0]+'：'+values[i]+(values2?'\n'+names[1]+'：'+values2[i]:''))}" tabindex="0"><circle cx="${x}" cy="${y}" r="8" fill="transparent"/><circle cx="${x}" cy="${y}" r="2.5" fill="var(--person-series-0)"/><text x="${x}" y="115" text-anchor="middle" style="font-size:10px">${esc(labels[i])}</text></g>`).join('')}</svg>`;
}
function bars(rows,max){max=max||Math.max(...rows.map(x=>x[1]));return `<div class="bar-list" style="--max:${max}">${rows.map(([name,v,unit=''])=>`<div class="bar-row"><span>${name}</span><div class="bar-track"><div class="bar-fill" style="--value:${v}"></div></div><b class="od-nowrap">${fmt(v)}${unit}</b></div>`).join('')}</div>`;}
const table=(headers,rows)=>`<table class="status-table"><thead><tr>${headers.map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(x=>`<td>${x}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
const caption=(a,b='今日 · 演示')=>`<div class="chart-caption"><span>${a}</span><span>${b}</span></div>`;
const tickets=[['能源隔离',3],['动火',4],['有限空间',2],['吊装',8],['高处',5],['临时用电',2]];
// Vessel charts use the existing metrics and the four map demonstration vessels.
const shipVoyageValues=[27,32,29,35,31,36,38];
function shipOverview(){
 const [serviceCount,,currentCount,peak]=panels.ships.rows.map(row=>row[1]),percent=currentCount/peak*100;
 return metrics([['服务船舶',serviceCount,'艘'],['当日在港',currentCount,'艘'],['今日峰值',peak,'艘']])+`<div class="ship-peak-comparison"><div class="ship-peak-label"><span>当前数量 / 今日峰值</span><strong>${percent}%</strong></div><progress class="ship-peak-progress" max="${peak}" value="${currentCount}" aria-label="当前在港 ${currentCount} 艘，相当于今日峰值 ${peak} 艘的 ${percent}%"></progress><div class="ship-peak-scale"><span>当前 ${currentCount} 艘</span><span>峰值 ${peak} 艘</span></div><p>当前较峰值少 <strong>${peak-currentCount}</strong> 艘</p></div>`+caption('当前数量与今日峰值对比','今日');
}
function shipVoyageColumns(){
 const max=Math.ceil(Math.max(...shipVoyageValues)/10)*10,baseline=158;
 return `<svg class="ship-voyage-columns" viewBox="0 0 420 200" role="img" aria-label="近七日航次：${days.map((day,i)=>day+' '+shipVoyageValues[i]+' 航次').join('，')}"><title>每日航次比较，统一零起点，今日 ${shipVoyageValues.at(-1)} 航次</title><defs><linearGradient id="ship-bar-blue" x2="0" y2="1"><stop stop-color="#79d6ff"/><stop offset="1" stop-color="#329eea" stop-opacity=".55"/></linearGradient><linearGradient id="ship-bar-today" x2="0" y2="1"><stop stop-color="#a0ffe5"/><stop offset="1" stop-color="#55dfc3" stop-opacity=".7"/></linearGradient></defs>${[0,max/2,max].map(value=>`<line x1="34" x2="407" y1="${baseline-value/max*116}" y2="${baseline-value/max*116}" class="gridline"/><text x="24" y="${baseline-value/max*116+4}" text-anchor="end">${value}</text>`).join('')}${shipVoyageValues.map((value,i)=>{const x=62+i*53,h=value/max*116;return `<g tabindex="0" data-tip="${esc(days[i]+'：'+value+' 航次'+(i===6?'（今日）':''))}"><rect x="${x-15}" y="${baseline-h}" width="30" height="${h}" rx="3" fill="url(#${i===6?'ship-bar-today':'ship-bar-blue'})"/><text x="${x}" y="${baseline-h-9}" text-anchor="middle" class="ship-column-value">${value}</text><text x="${x}" y="181" text-anchor="middle" class="${i===6?'ship-column-today':''}">${days[i]}</text></g>`;}).join('')}</svg>`+caption('近七日每日航次 · 绿色为今日','单位：航次');
}
function shipInPortChart(){
 const rows=panels.shipPeak.rows,values=rows.map(row=>row[1]),peak=Math.max(...values),index=values.indexOf(peak);
 const max=Math.ceil(peak*1.15/10)*10,x=32+index*308/(values.length-1),y=94-peak/max*73;
 return lineChart(values,null,rows.map(row=>row[0]),['在港船舶']).replace('</svg>',`<text x="${x}" y="${y-12}" text-anchor="middle" class="ship-peak-annotation">峰值 ${peak} 艘</text></svg>`)+caption('今日在港峰值 '+peak+' 艘','单位：艘');
}
function shipStatusOverview(){
 const vessels=points.filter(p=>p.kind==='船舶'),total=vessels.length;
 const statuses=[...new Set(vessels.map(p=>p.status))];
 const radius=55,circumference=2*Math.PI*radius;let offset=0;
 const entries=statuses.map((name,i)=>({name,count:vessels.filter(p=>p.status===name).length,color:`var(--person-series-${i})`}));
 const arcs=entries.map(({name,count,color})=>{const start=offset;offset+=count;const tip=esc(name+'：'+count+' 艘，'+(count/total*100).toFixed(0)+'%');return `<circle cx="80" cy="80" r="${radius}" fill="none" stroke="${color}" stroke-width="16" stroke-dasharray="${count/total*circumference-2} ${circumference}" stroke-dashoffset="${-start/total*circumference}" transform="rotate(-90 80 80)" tabindex="0" data-tip="${tip}"><title>${tip}</title></circle>`;}).join('');
 return `<div class="ship-status-overview"><div class="ship-status-ring"><svg viewBox="0 0 160 160" role="img" aria-label="${total}艘示意船舶状态构成：${entries.map(e=>e.name+e.count+'艘').join('，')}">${arcs}</svg><div><strong>${total}<small> 艘</small></strong><span>示意船舶</span></div></div><div class="ship-status-legend">${entries.map(({name,count,color})=>`<div><span class="person-series-label" style="--item-color:${color}">${esc(name)}</span><strong>${count}<small> 艘</small></strong><span>${(count/total*100).toFixed(0)}%</span></div>`).join('')}</div></div><p class="ship-sample-note">仅统计下方 ${total} 艘示意船舶，不代表全部在港船舶</p>`+linkedRows(vessels.map(p=>[p.name.replace('示意船舶 ',''),p.berth+' · '+p.status,'data-locate',p.id]));
}
// Vehicle stock, traffic counts and approval summaries have separate scopes.
const vehicleHistory=[62,74,68,81,79,91,86];
const vehicleTraffic=[['进场',142,'车次'],['出场',126,'车次']];
const vehicleApprovalTotals=[['待审批',3],['已通过',18],['已驳回',1]];
const vehicleTrafficTotal=()=>vehicleTraffic.reduce((sum,row)=>sum+row[1],0);
function vehicleOverview(){
 return `<div class="vehicle-compact-overview"><div class="vehicle-main-count"><span>当前在场车辆</span><strong>${vehicleHistory.at(-1)}<small> 辆</small></strong></div><div class="vehicle-secondary-counts"><div><span>今日进出车次</span><strong>${vehicleTrafficTotal()}<small> 车次</small></strong></div><div><span>待审批</span><strong>${vehicleApprovalTotals[0][1]}<small> 单</small></strong></div></div></div>`;
}

function vehicleTrafficColumns(){
 const max=Math.ceil(Math.max(...vehicleTraffic.map(row=>row[1]))/20)*20;
 return `<div class="vehicle-traffic-total"><span>今日进出合计</span><strong>${vehicleTrafficTotal()}<small> 车次</small></strong></div><svg class="vehicle-traffic-columns" viewBox="0 0 420 210" role="img" aria-label="今日进场 ${vehicleTraffic[0][1]} 车次，出场 ${vehicleTraffic[1][1]} 车次，合计 ${vehicleTrafficTotal()} 车次"><title>今日车辆进出，统一零起点，单位：车次</title><defs><linearGradient id="vehicle-entry-fill" x2="0" y2="1"><stop stop-color="#79d6ff"/><stop offset="1" stop-color="#329eea" stop-opacity=".55"/></linearGradient><linearGradient id="vehicle-exit-fill" x2="0" y2="1"><stop stop-color="#a0ffe5"/><stop offset="1" stop-color="#55dfc3" stop-opacity=".7"/></linearGradient></defs>${[0,max/2,max].map(value=>`<line class="gridline" x1="42" x2="400" y1="${165-value/max*120}" y2="${165-value/max*120}"/><text x="32" y="${169-value/max*120}" text-anchor="end">${value}</text>`).join('')}${vehicleTraffic.map(([name,value],i)=>{const x=136+i*158,h=value/max*120;return `<g tabindex="0" data-tip="${esc(name+'：'+value+' 车次')}"><rect x="${x-32}" y="${165-h}" width="64" height="${h}" rx="4" fill="url(#${i===0?'vehicle-entry-fill':'vehicle-exit-fill'})"/><text class="vehicle-bar-value" x="${x}" y="${155-h}" text-anchor="middle">${value}</text><text x="${x}" y="191" text-anchor="middle">${name}</text></g>`;}).join('')}</svg>`+caption('进出按车次统计','今日 · 单位：车次');
}
function vehicleApprovalOverview(){
 const total=vehicleApprovalTotals.reduce((sum,row)=>sum+row[1],0),radius=54,circumference=2*Math.PI*radius;
 const colors=['var(--person-series-2)','var(--person-series-1)','var(--person-series-3)'];let offset=0;
 const arcs=vehicleApprovalTotals.map(([name,count],i)=>{const start=offset;offset+=count;const tip=esc(name+'：'+count+' 单，'+(count/total*100).toFixed(1)+'%');return `<circle cx="80" cy="80" r="${radius}" fill="none" stroke="${colors[i]}" stroke-width="16" stroke-dasharray="${count/total*circumference-1.5} ${circumference}" stroke-dashoffset="${-start/total*circumference}" transform="rotate(-90 80 80)" tabindex="0" data-tip="${tip}"><title>${tip}</title></circle>`;}).join('');
 const pending=panels.approvals.rows.filter(row=>row[2]==='待审批');
 return `<div class="vehicle-approval-overview"><div class="vehicle-approval-ring"><svg viewBox="0 0 160 160" role="img" aria-label="审批汇总 ${total} 单：${vehicleApprovalTotals.map(([name,count])=>name+count+'单').join('，')}">${arcs}</svg><div><strong>${total}<small> 单</small></strong><span>审批汇总</span></div></div><div class="vehicle-approval-legend">${vehicleApprovalTotals.map(([name,count],i)=>`<div style="--item-color:${colors[i]}"><span><i></i>${name}</span><strong>${count}<small> 单</small></strong><span>${(count/total*100).toFixed(1)}%</span></div>`).join('')}</div></div><p class="vehicle-scope-note">审批汇总 ${total} 单；下方为 ${pending.length} 条待审批示例</p>`+table(['申请单号','类型','状态'],pending.map(([id,type,status])=>[id.replace('CM-1022-','…'),type,status]));
}
function vehicleObjectList(){
 const objects=points.filter(p=>['叉车','拖车','平板拖车'].includes(p.kind));
 return `<p class="vehicle-scope-note">${objects.length} 辆示意车辆，不代表全部 ${vehicleHistory.at(-1)} 辆在场车辆</p><div class="vehicle-object-list">${objects.map(p=>`<button class="vehicle-object-row" data-locate="${p.id}">${icon(layerKinds[p.kind])}<span class="od-field"><strong>${esc(p.name.replace('示意',''))}</strong><small>${esc(p.kind)} · 示意位置</small></span><span class="vehicle-object-status" data-status="${esc(p.status)}">${esc(p.status)}</span>${icon('arrow')}</button>`).join('')}</div>`;
}
// Production totals and category counts are demonstration data, without an assumed daily scope.
const productionSeries={'柴油':[84,96,92,108,116,112,126],'灰浆':[220,240,230,280,265,296,320],'件杂货':[1820,1960,1900,2120,2080,2260,2414],'吞吐量':[2100,2360,2280,2520,2410,2668,2860]};
const productionTasks={total:120,accepted:116,completed:104,categories:[['管输',36,' 单'],['场地',48,' 单'],['泊位',36,' 单']]};
const cargoStates=[['已完成',14],['作业中',2]];
const productionCompletion=()=>Number((productionTasks.completed/productionTasks.total*100).toFixed(1));
function productionRing(value,label,entries,total){
 const radius=52,circumference=2*Math.PI*radius;let offset=0;
 const arcs=entries.map(([name,count],i)=>{const start=offset;offset+=count;const tip=esc(`${name}：${count}，${(count/total*100).toFixed(1)}%`);return `<circle cx="70" cy="70" r="${radius}" fill="none" stroke="var(--person-series-${i})" stroke-width="14" stroke-dasharray="${count/total*circumference} ${circumference}" stroke-dashoffset="${-start/total*circumference}" transform="rotate(-90 70 70)" tabindex="0" data-tip="${tip}"><title>${tip}</title></circle>`;}).join('');
 return `<div class="production-ring"><svg viewBox="0 0 140 140" role="img" aria-label="${esc(label+'：'+value+'；'+entries.map(([name,count])=>name+' '+count).join('，'))}">${arcs}</svg><div><strong>${value}</strong><span>${label}</span></div></div>`;
}
function productionOverview(){
 const d=productionTasks;
 return `<div class="production-overview">${productionRing(productionCompletion()+'%','作业完成率',[['已完成',d.completed],['未完成',d.total-d.completed]],d.total)}<div class="production-counts">${[['任务总数',d.total],['已接单',d.accepted],['已完成',d.completed]].map(([name,value])=>`<div><span>${name}</span><strong>${value}<small> 单</small></strong></div>`).join('')}</div></div><div class="production-section-label"><span>任务分类</span><small>单位：单</small></div>`+bars(d.categories,Math.max(...d.categories.map(r=>r[1])))+caption('完成率 = 已完成 / 任务总数','演示数据');
}
function productionShipWork(){
 const rows=panels.shipWork.rows;
 return `<div class="production-hero"><span>年吞吐量 · 年度</span><strong>${fmt(rows[0][1])}<small> ${rows[0][2]}</small></strong></div>`+metrics(rows.slice(1))+caption('船舶作业规模与效率','演示数据');
}
function productionCargo(){
 const total=panels.cargo.rows[2][1];
 return metrics(panels.cargo.rows.slice(0,3))+`<div class="production-cargo-status"><div class="production-section-label"><span>卸装船次进展</span><small>共 ${total} 船次</small></div><div class="production-segments" role="img" aria-label="${cargoStates.map(([name,count])=>name+count+'船次').join('，')}">${cargoStates.map(([name,count],i)=>`<span style="width:${count/total*100}%;--segment-color:var(--person-series-${i})" tabindex="0" data-tip="${name}：${count} 船次"></span>`).join('')}</div><div class="production-state-labels">${cargoStates.map(([name,count],i)=>`<span style="--item-color:var(--person-series-${i})"><i></i>${name}<strong>${count}<small> 船次</small></strong></span>`).join('')}</div></div>`+caption('件数、吨数与船次分别统计','演示数据');
}
function productionFuel(){
 const rows=panels.fuel.rows;
 return `<div class="production-hero"><span>柴油储存</span><strong>${fmt(rows[0][1])}<small> ${rows[0][2]}</small></strong></div>`+metrics(rows.slice(1))+caption('库存与加油业务量分别展示','演示数据');
}
function productionAsh(){
 const rows=panels.ash.rows,total=rows[0][1],entries=rows.slice(1).map(([name,count])=>[name.replace('船次',''),count]);
 return `<div class="production-ash-overview">${productionRing(total,'输送反打船次',entries,total)}<div class="production-ash-legend">${entries.map(([name,count],i)=>`<div style="--item-color:var(--person-series-${i})"><span><i></i>${name}</span><strong>${count}<small> 船次</small></strong><small>${(count/total*100).toFixed(0)}%</small></div>`).join('')}</div></div>`+caption('输送与反打船次构成','演示数据');
}
function productionTrend(){
 const values=productionSeries[trendChoice],latest=values.at(-1),difference=latest-values.at(-2),percent=(difference/values.at(-2)*100).toFixed(1);
 return strip(Object.keys(productionSeries),'data-production-series',trendChoice)+`<div class="production-trend-value"><span>${trendChoice} · ${days.at(-1)}</span><strong>${fmt(latest)}<small> t</small></strong><span>较前日 <b>${difference>=0?'+':''}${fmt(difference)} t / ${percent}%</b></span></div>`+lineChart(values,null,days,[trendChoice+'（t）'])+caption('近七日 · 演示数据','单位：t');
}
// Safety equipment states: in-use is a subset of available, not another additive category.
const safetyEquipment=[{name:'消防水泵',total:8,available:8,stopped:0,inUse:2,integrity:100},{name:'空压机',total:12,available:11,stopped:1,inUse:6,integrity:91.7},{name:'生活水泵',total:6,available:6,stopped:0,inUse:3,integrity:100}];
const safetyHistory=[18,22,20,26,23,21,24];
const safetyTotals=()=>({total:safetyEquipment.reduce((n,e)=>n+e.total,0),available:safetyEquipment.reduce((n,e)=>n+e.available,0),stopped:safetyEquipment.reduce((n,e)=>n+e.stopped,0),inUse:safetyEquipment.reduce((n,e)=>n+e.inUse,0)});
function safetyOverview(){
 return metrics(panels.safety.rows.slice(0,3))+bars(tickets.map(([name,count])=>[name,count,' 张']),Math.max(...tickets.map(row=>row[1])))+caption('六类高风险作业票 · 单位：张','今日 · 演示');
}
function safetyEquipmentCards(){
 return `<div class="safety-equipment-list">${safetyEquipment.map(e=>`<div class="safety-equipment-card ${e.stopped?'has-stopped':''}"><div class="safety-equipment-head"><strong>${e.name}</strong><span>完好率 <b>${e.integrity}%</b></span></div><div class="safety-equipment-counts">${[['总数',e.total],['可用',e.available],['停用',e.stopped],['在用',e.inUse]].map(([name,value])=>`<div><span>${name}</span><strong>${value}<small> 台</small></strong></div>`).join('')}</div></div>`).join('')}</div>`+caption('在用属于可用，不重复累加','演示数据');
}
function safetyAvailability(){
 const d=safetyTotals(),integrity=panels.availability.rows[2][1],annual=panels.availability.rows[1][1];
 return `<div class="safety-availability">${productionRing(integrity+'%','当前完好率',[['当前完好率',integrity],['其余占比',Number((100-integrity).toFixed(1))]],100)}<div class="safety-reliability-values"><div><span>设备总数</span><strong>${d.total}<small> 台</small></strong></div><div><span>年可用率 · 年度</span><strong>${annual}<small>%</small></strong></div></div></div>`+metrics([['可用',d.available,'台'],['停用',d.stopped,'台'],['在用',d.inUse,'台']])+caption('完好率与年可用率分别统计','演示数据');
}
function safetyPermitList(){
 return `<div class="safety-permit-list">${panels.permits.rows.map(([id,type,status])=>`<div class="safety-permit-row"><span><strong>${id}</strong><small>${type}</small></span><span class="safety-state" data-state="${status}">${status}</span></div>`).join('')}</div>`+caption('4 条示例记录，非全部作业票','今日 · 演示');
}
function safetyTrendColumns(){
 const max=30,baseline=126;
 return `<svg class="safety-columns" viewBox="0 0 400 165" role="img" aria-label="近七日高风险作业票：${days.map((d,i)=>d+' '+safetyHistory[i]+'张').join('，')}">${[0,15,30].map(n=>`<line class="gridline" x1="29" x2="393" y1="${baseline-n/max*96}" y2="${baseline-n/max*96}"/><text x="20" y="${baseline-n/max*96+4}" text-anchor="end">${n}</text>`).join('')}${safetyHistory.map((n,i)=>{const x=53+i*53,h=n/max*96;return `<g tabindex="0" data-tip="${days[i]}：${n} 张"><rect x="${x-13}" y="${baseline-h}" width="26" height="${h}" rx="2" fill="var(--person-series-${i===6?1:0})"/><text x="${x}" y="${baseline-h-7}" text-anchor="middle" class="safety-column-value">${n}</text><text x="${x}" y="148" text-anchor="middle">${days[i]}</text></g>`;}).join('')}</svg>`+caption('近七日 · 绿色为最新一天','单位：张');
}
const panels={
 production:{title:'生产作业',topic:'production',kind:'场地',rows:[['作业完成率',productionCompletion(),'%'],['任务数',productionTasks.total,'单'],['接单数',productionTasks.accepted,'单'],['已完成',productionTasks.completed,'单'],...productionTasks.categories.map(([name,count])=>[name+'任务',count,'单'])],render:productionOverview},
 ships:{title:'船舶概况',topic:'ships',kind:'船舶',rows:[['服务船舶数量',26,'艘'],['服务航次',38,'航次'],['当日在港',12,'艘'],['今日船舶峰值',16,'艘']],render:shipOverview},
 safety:{title:'高风险作业统计',topic:'safety',kind:'场地',rows:[['今日作业许可量',24,'项'],['作业票数量',tickets.reduce((n,row)=>n+row[1],0),'张'],['执行中',9,'项'],...tickets.map(([k,v])=>[k,v,'张'])],render:safetyOverview},
 vehicles:{title:'车辆概况',topic:'vehicles',kind:'拖车',rows:[['在场车辆',vehicleHistory.at(-1),'辆'],['今日进场车次',vehicleTraffic[0][1],'车次'],['今日出场车次',vehicleTraffic[1][1],'车次'],['出门审批待审',vehicleApprovalTotals[0][1],'单'],['出门审批已通过',vehicleApprovalTotals[1][1],'单']],render:vehicleOverview},
 approvals:{title:'出门审批',topic:'people',kind:'门禁',rows:[['CM-1022-021','作业车辆','待审批'],['CM-1022-020','物资运输','待审批'],['CM-1022-019','设备出场','待审批'],['CM-1022-018','作业车辆','已通过']],headers:['申请编号','类型','状态'],render:vehicleApprovalOverview},
 voyages:{title:'近七日航次',topic:'ships',kind:'船舶',rows:days.map((day,i)=>[day,shipVoyageValues[i],'航次']),render:shipVoyageColumns},
 berths:{title:'在港船舶',topic:'ships',kind:'船舶',headers:['船舶编号','泊位（示意）','状态'],rows:[['示意船舶 A01','01 号泊位','装卸中'],['示意船舶 A02','02 号泊位','加油中'],['示意船舶 A03','03 号泊位','待作业'],['示意船舶 A04','04 号泊位','装卸中']],render:shipStatusOverview},
 shipWork:{title:'船舶作业指标',topic:'production',kind:'船舶',rows:[['年吞吐量',128.6,'万吨'],['装卸效率',186,'t/h'],['船舶平均在岗时间',8.4,'h']],render:productionShipWork},
 shipPeak:{title:'在港数量变化',topic:'ships',kind:'船舶',rows:[['00:00',8,'艘'],['04:00',10,'艘'],['08:00',14,'艘'],['12:00',16,'艘'],['16:00',12,'艘']],render:shipInPortChart},
 cargo:{title:'卸装作业',topic:'production',kind:'场地',rows:[['卸装件数',1248,'件'],['卸装吨数',2860,'t'],['卸装船次',cargoStates.reduce((sum,row)=>sum+row[1],0),'船次'],...cargoStates.map(([name,count])=>[name,count,'船次'])],render:productionCargo},
 fuel:{title:'加油作业',topic:'production',kind:'船舶',rows:[['柴油储存',680,'t'],['加油吨数',126,'t'],['加油船次',10,'船次']],render:productionFuel},
 ash:{title:'输灰作业',topic:'production',kind:'场地',rows:[['输送反打船次',8,'船次'],['输送船次',6,'船次'],['反打船次',2,'船次']],render:productionAsh},
 prodTrend:{title:'生产趋势',topic:'production',kind:'场地',headers:['业务','最新值','前日值'],rows:Object.entries(productionSeries).map(([name,values])=>[name+'（t）',values.at(-1),values.at(-2)]),render:productionTrend},
 electricity:{title:'电力使用',topic:'energy',kind:'场地',rows:[['总用电量',42860,'kWh'],['购电量',32100,'kWh'],['光伏自用电',10760,'kWh']],render:()=>metrics([['总用电量',42860,'kWh'],['购电量',32100,'kWh'],['光伏自用',10760,'kWh']])+bars([['购电',32100],['光伏自用',10760]],42860)+caption('总用电＝购电＋光伏自用','今日')},
 solar:{title:'光伏发电',topic:'energy',kind:'场地',rows:[['总发电量',12860,'kWh'],['光伏自用电',10760,'kWh'],['外送电量',2100,'kWh']],render:()=>metrics([['总发电量',12860,'kWh'],['光伏自用',10760,'kWh'],['外送电量',2100,'kWh']])+lineChart([0,820,2480,4860,3620,1080,0],null,['00时','04时','08时','12时','16时','20时','24时'],['发电量'])+caption('示例日内发电分布','单位：kWh')},
 shore:{title:'岸电使用',topic:'energy',kind:'船舶',rows:[['岸电总用量',8640,'kWh'],['01 号泊位',3280,'kWh'],['02 号泊位',2860,'kWh'],['03 号泊位',2500,'kWh']],render:()=>metrics([['岸电使用',8640,'kWh']])+bars([['01 号泊位',3280],['02 号泊位',2860],['03 号泊位',2500]],4000)+caption('泊位名称及位置为示意')},
 resources:{title:'油气水消耗',topic:'energy',kind:'场地',rows:[['柴油消耗',18.6,'t'],['淡水消耗',326,'m³'],['LNG 加注',42.5,'t']],render:()=>metrics([['柴油消耗',18.6,'t'],['淡水消耗',326,'m³'],['LNG 加注',42.5,'t']])+table(['能源类型','统计周期','计量单位'],[['柴油','今日','t'],['淡水','今日','m³'],['LNG','今日','t']])},
 carbon:{title:'碳减排',topic:'energy',kind:'场地',rows:[['今日碳减排',7.82,'tCO₂'],['本月碳减排',186.4,'tCO₂'],['本年碳减排',2148.6,'tCO₂']],render:()=>metrics([['今日',7.82,'tCO₂'],['本月',186.4,'tCO₂'],['本年',2148.6,'tCO₂']])+lineChart([6.2,7.1,6.8,7.6,7.4,8.1,7.82],null,days,['碳减排量'])+caption('仅演示展示，未设定排放因子','单位：tCO₂')},
 energyTrend:{title:'用电量趋势',topic:'energy',kind:'场地',rows:days.map((d,i)=>[d,[38620,40180,39480,42060,41240,43120,42860][i],'kWh']),render:()=>lineChart([38620,40180,39480,42060,41240,43120,42860],null,days,['用电量'])+caption('近七日总用电量','单位：kWh')},
 equipment:{title:'关键重要设备',topic:'safety',kind:'场地',headers:['设备','总数','可用','停用','在用','完好率'],rows:safetyEquipment.map(e=>[e.name,e.total,e.available,e.stopped,e.inUse,e.integrity+'%']),render:safetyEquipmentCards},
 availability:{title:'设备保障概况',topic:'safety',kind:'场地',rows:[['设备总数',safetyTotals().total,'台'],['年可用率',98.6,'%'],['当前完好率',96.2,'%'],['可用设备',safetyTotals().available,'台'],['停用设备',safetyTotals().stopped,'台'],['在用设备',safetyTotals().inUse,'台']],render:safetyAvailability},
 permits:{title:'作业许可记录',topic:'safety',kind:'场地',headers:['票号','作业类型','状态'],rows:[['PT-1022-024','吊装','执行中'],['PT-1022-023','动火','执行中'],['PT-1022-022','有限空间','待开始'],['PT-1022-021','高处','已结束']],render:safetyPermitList},
 risks:{title:'重点关注',topic:'safety',kind:'场地',headers:['事项','位置（示意）','状态'],rows:[['空压机停用','设备区','检修中'],['吊装作业','03 号场地','执行中'],['动火作业','维修区','执行中']],render:()=>linkedRows([['空压机停用','示意设备区 · 检修中','data-locate','a3'],['吊装作业','示意场地 B区 · 执行中','data-locate','a2'],['出门申请','3 单待审批 · 待办事项','data-detail','approvals']])},
 safetyTrend:{title:'作业票趋势',topic:'safety',kind:'场地',rows:days.map((d,i)=>[d,safetyHistory[i],'张']),render:safetyTrendColumns}
};
const topics={
 production:{name:'生产作业',en:'PRODUCTION OPERATIONS',left:['throughput','shipService','taskOverview'],right:['highRisk','stockyard','chemicals'],leftRows:'.96fr 1.12fr .92fr',rightRows:'1.2fr .95fr .85fr',layers:['场地','叉车','拖车','平板拖车','汽车吊','轮胎吊','船舶']},
 safety:{name:'安全合规',en:'SAFETY & COMPLIANCE',left:['personnel','vehicleManagement'],right:['hazardManagement','equipmentUsage'],leftRows:'1.12fr .88fr',rightRows:'.95fr 1.05fr',layers:['门禁','拖车','平板拖车','叉车','场地','汽车吊','轮胎吊']},
 resources:{name:'资源保障',en:'RESOURCE SUPPORT',left:['energyMonitoring','intelligentDevices'],right:['alertEvents','aiRecognition'],leftRows:'1fr 1fr',rightRows:'1fr 1fr',layers:['场地','船舶','摄像头','门禁']},
 map:{name:'地图',en:'PORT MAP EXPLORER',panels:['mapObjects','mapGuide'],layers:['叉车','船舶','拖车','平板拖车','汽车吊','轮胎吊','摄像头','门禁','场地'],layout:'map'}
};
const topicAliases={people:'safety',vehicles:'safety',ships:'production',energy:'resources',video:'resources'};
function resolveTopic(key){return topics[key]?key:topicAliases[key]||defaultTopic();}

const layerKinds={'叉车':'forklift','船舶':'ship','拖车':'truck','平板拖车':'truck','汽车吊':'crane','轮胎吊':'crane','摄像头':'camera','门禁':'gate','场地':'area'};
const point=(id,kind,x,y,name,status='正常',extra={})=>({id,kind,x,y,name,status,...extra});
const points=[
 point('s1','船舶',20,20,'示意船舶 A01','装卸中',{berth:'01 号泊位',task:'件杂货装卸'}),point('s2','船舶',53,43,'示意船舶 A02','加油中',{berth:'02 号泊位',task:'柴油加注'}),point('s3','船舶',61,39,'示意船舶 A03','待作业',{berth:'03 号泊位',task:'输灰'}),point('s4','船舶',75,32,'示意船舶 A04','装卸中',{berth:'04 号泊位',task:'物资装卸'}),
 point('f1','叉车',34,44,'示意叉车 F01','作业中'),point('f2','叉车',44,59,'示意叉车 F02','空闲'),point('t1','拖车',39,64,'示意拖车 T01','运输中'),point('t2','拖车',67,56,'示意拖车 T02','运输中'),point('p1','平板拖车',49,72,'示意平板车 P01','作业中'),point('c1','汽车吊',31,32,'示意汽车吊 C01','作业中'),point('c2','轮胎吊',51,57,'示意轮胎吊 C02','作业中'),
 point('v1','摄像头',27,30,'01 泊位监控','模拟通道',{channel:0}),point('v2','摄像头',47,66,'作业区监控','模拟通道',{channel:1}),point('v3','摄像头',69,71,'出入口监控','模拟通道',{channel:2}),point('g1','门禁',58,74,'示意门岗 G01','正常'),point('g2','门禁',79,64,'示意门岗 G02','正常'),point('a1','场地',40,39,'示意场地 A区','正常'),point('a2','场地',58,57,'示意场地 B区','吊装作业',{alert:true}),point('a3','场地',34,61,'示意设备区','检修中',{alert:true})
];
const cameras=['01 泊位监控','作业区监控','出入口监控'];
const cameraPositions=['20% 30%','48% 58%','75% 70%'];
let current='production', selected=null, enabled=new Set(topics.production.layers), zoom=1,panX=0,panY=0,baseWidth=0, drag=null, lastPointFocus=null, currentPanel=null, previousFocus=null;
// V2.3: finalized eight-menu organization and version 1 menu buttons.
let trendChoice='吞吐量',objectQuery='';
const dashboardLayoutKey='hainan-port-dashboard-layout';
const dashboardLayouts=new Set(['wide']);
let dashboardLayout='wide',previewScale=1;
try{const saved=localStorage.getItem(dashboardLayoutKey);if(saved==='default'||dashboardLayouts.has(saved))dashboardLayout=saved;}catch{}
// Display ratio is shared by every topic; 32:9 uses scheme 2.
function activeDashboardLayout(){return dashboardLayout;}
const pageStyleKey='hainan-port-people-page-style';
const dataDisplayKey='hainan-port-people-data-display';
let pageStyle='glass',dataDisplay='flat';
try{
 const savedStyle=localStorage.getItem(pageStyleKey),savedDisplay=localStorage.getItem(dataDisplayKey);
 if(savedStyle==='airy'||savedStyle==='dimensional')pageStyle='airy';
 if(['flat','dimensional'].includes(savedDisplay))dataDisplay=savedDisplay;
 else if(savedStyle==='dimensional')dataDisplay='dimensional';
 // Persist the independent data choice before migrating the old combined style.
 if(savedStyle==='dimensional'){
  localStorage.setItem(dataDisplayKey,dataDisplay);
  localStorage.setItem(pageStyleKey,pageStyle);
 }
}catch{}
function syncPageAppearance(){
 const supported=true;
 if(supported&&pageStyle==='airy')document.documentElement.dataset.pageStyle='airy';
 else delete document.documentElement.dataset.pageStyle;
 if(supported&&dataDisplay==='dimensional')document.documentElement.dataset.chartMode='dimensional';
 else delete document.documentElement.dataset.chartMode;
 document.querySelectorAll('[data-page-style-choice]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.pageStyleChoice===pageStyle)));
 document.querySelectorAll('[data-display-choice]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.displayChoice===dataDisplay)));
 $('#page-style-note').textContent=supported?'两组设置可独立组合，支持四个专题的 16:9 与 32:9。':'设置已记住；切回人员动态时生效。';
}
const personSeries={'管理人员':[104,112,108,120,116,124,128],'作业人员':[242,281,260,306,294,321,334],'参观访问':[38,40,42,44,40,45,46],'船舶相关':[102,99,98,105,98,106,104]};
const strip=(items,attr,active)=>`<div class="view-switch" role="group">${items.map(k=>`<button ${attr}="${esc(k)}" aria-pressed="${k===active}">${esc(k)}</button>`).join('')}</div>`;
function linkedRows(rows){return `<div class="linked-rows od-stack">${rows.map(([title,detail,attr,value])=>`<button ${attr}="${value}" class="linked-row od-row"><span class="od-field od-fill"><strong>${esc(title)}</strong><small>${esc(detail)}</small></span>${icon('arrow')}</button>`).join('')}</div>`;}
// Personnel data has distinct stocks (currently on site) and flows (daily entries).
const onSiteRoles=[['管理',96],['作业',214],['参观访问',24],['船舶相关',52]];
const dailyEntries=days.map((_,i)=>Object.values(personSeries).reduce((sum,series)=>sum+series[i],0));
const todayEntry=dailyEntries.at(-1),previousEntry=dailyEntries.at(-2);
const personnelNumber=(value,label)=>`<div class="person-number od-stat"><strong class="od-nowrap">${fmt(value)}<small>人</small></strong><span>${label}</span></div>`;
function personnelRoleGrid(rows){return `<div class="person-role-grid">${rows.map(([label,value])=>`<div class="od-stat"><span>${label}</span><strong class="od-nowrap">${value}<small> 人</small></strong></div>`).join('')}</div>`;}
// Dimensional geometry is derived from the same values as the flat charts.
function personnelSolidRing(rows,key,total){
 const outer=84,inner=58,depth=24,sy=.78;
 const point=(r,a,d=0)=>[100+r*Math.cos(a*Math.PI/180),88+r*sy*Math.sin(a*Math.PI/180)+d];
 const wall=(r,a,b)=>{const p=point(r,a),q=point(r,b),u=point(r,b,depth),v=point(r,a,depth);return `M${p} A${r},${r*sy} 0 ${b-a>180?1:0} 1 ${q} L${u} A${r},${r*sy} 0 ${b-a>180?1:0} 0 ${v} Z`;};
 let offset=-90;
 const sectors=rows.map(([name,value],i)=>{const start=offset;offset+=value/total*360;return {name,value,i,start,end:offset-.6};});
 const defs=sectors.map(({i})=>`<linearGradient id="${key}-solid-top-${i}" x2=".6" y2="1"><stop stop-color="color-mix(in srgb,var(--person-series-${i}) 65%,white)"/><stop offset=".45" stop-color="var(--person-series-${i})"/><stop offset="1" stop-color="color-mix(in srgb,var(--person-series-${i}) 80%,#17324a)"/></linearGradient><linearGradient id="${key}-solid-wall-${i}" x2="0" y2="1"><stop stop-color="color-mix(in srgb,var(--person-series-${i}) 64%,#102235)"/><stop offset="1" stop-color="color-mix(in srgb,var(--person-series-${i}) 30%,#07131e)"/></linearGradient>`).join('');
 const walls=sectors.map(({i,start,end})=>[[outer,0,180],[inner,-90,0],[inner,180,270]].map(([r,a,b])=>{a=Math.max(a,start);b=Math.min(b,end);return b>a?`<path d="${wall(r,a,b)}" fill="url(#${key}-solid-wall-${i})"/>`:'';}).join('')).join('');
 const tops=sectors.map(({name,value,i,start,end})=>{const a=point(outer,start),b=point(outer,end),c=point(inner,end),d=point(inner,start),large=end-start>180?1:0,tip=esc(name+'：'+value+' 人，'+(value/total*100).toFixed(1)+'%');return `<path class="person-ring-top" d="M${a} A${outer},${outer*sy} 0 ${large} 1 ${b} L${c} A${inner},${inner*sy} 0 ${large} 0 ${d} Z" fill="url(#${key}-solid-top-${i})" stroke="rgba(238,253,255,.4)" stroke-width=".65" tabindex="0" data-tip="${tip}"><title>${tip}</title></path>`;}).join('');
 return `<g class="person-chart-depth"><defs>${defs}</defs><ellipse cx="100" cy="177" rx="83" ry="12" fill="rgba(0,8,18,.4)" class="person-ring-floor"/><g aria-hidden="true" pointer-events="none">${walls}</g>${tops}</g>`;
}
function personnelTrendChart(values,name){
 const min=Math.min(...values),max=Math.max(...values),range=max-min||1;
 const coords=values.map((value,i)=>[12+i*296/6,43-(value-min)/range*26]);
 const path=coords.map(([x,y],i)=>(i?'L':'M')+x+','+y).join(' ');
 const key='person-trend-solid-'+Object.keys(personSeries).indexOf(name);
 const solid=`<g class="person-chart-depth"><defs><linearGradient id="${key}-rail" x2="0" y2="1"><stop stop-color="color-mix(in srgb,var(--trend-color) 40%,white)"/><stop offset="1" stop-color="var(--trend-color)"/></linearGradient><radialGradient id="${key}-node" cx=".3" cy=".25" r=".75"><stop stop-color="#f5fdff"/><stop offset=".3" stop-color="var(--trend-color)"/><stop offset="1" stop-color="color-mix(in srgb,var(--trend-color) 35%,#071727)"/></radialGradient></defs><path d="${path}" transform="translate(0 5)" class="person-solid-rail-shadow"/><path d="${path}" stroke="url(#${key}-rail)" class="person-solid-rail"/><path d="${path}" transform="translate(0 -1)" class="person-solid-rail-glint"/>${coords.map(([x,y],i)=>`<g tabindex="0" data-tip="${esc(days[i]+'\n'+name+'入场：'+values[i]+' 人')}"><ellipse cx="${x}" cy="${y+6}" rx="6" ry="2" fill="rgba(0,8,18,.45)"/><circle cx="${x}" cy="${y}" r="4.8" fill="url(#${key}-node)"/><circle cx="${x}" cy="${y}" r="9" fill="transparent"/></g>`).join('')}</g>`;
 return `<svg class="person-trend-chart" viewBox="0 0 320 60" role="img" aria-label="${name}近七日入场人数：${values.join('、')}人"><title>${name}近七日入场趋势，独立纵轴 ${min}—${max} 人</title><g class="person-chart-flat"><path d="${path}" class="person-trend-line"/>${coords.map(([x,y],i)=>`<g tabindex="0" data-tip="${esc(days[i]+'\n'+name+'入场：'+values[i]+' 人')}"><circle cx="${x}" cy="${y}" r="8" fill="transparent"/><circle cx="${x}" cy="${y}" r="2.8" class="person-trend-dot"/></g>`).join('')}</g>${solid}</svg>`;
}
function personnelShare(rows,ring=false){
 const total=rows.reduce((sum,[,n])=>sum+n,0),radius=72,circumference=2*Math.PI*radius;
 const key=ring?'weekly':'onsite';let offset=0;
 const geometry=rows.map(([name,value],i)=>{
  const info=esc(name+'：'+value+' 人，'+(value/total*100).toFixed(1)+'%');
  const color=i<2?`url(#${key}-ring-${i})`:`var(--person-series-${i})`;
  const circle=`<circle cx="100" cy="100" r="${radius}" fill="none" stroke="${color}" stroke-width="20" stroke-dasharray="${Math.max(0,value/total*circumference-1)} ${circumference}" stroke-dashoffset="${-offset/total*circumference}" transform="rotate(-90 100 100)" tabindex="0" data-tip="${info}"><title>${info}</title></circle>`;
  offset+=value;return circle;
 }).join('');
 return `<div class="person-share"><div class="person-share-graphic"><svg viewBox="0 0 200 200" role="img" aria-label="${ring?'近七日分类入场构成':'当前在场人员海油内外构成'}，合计 ${total} 人"><defs><linearGradient id="${key}-ring-0" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#269dff"/><stop offset="1" stop-color="#81e7ff"/></linearGradient><linearGradient id="${key}-ring-1" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#55e5cb"/><stop offset="1" stop-color="#9af6e5"/></linearGradient></defs><g class="person-chart-flat">${geometry}</g>${personnelSolidRing(rows,key,total)}</svg><div class="person-ring-center od-stat"><strong>${fmt(total)}</strong><span>${ring?'七日累计入场':'总计人数'}</span></div></div><div class="person-share-legend">${rows.map(([name,value],i)=>`<div class="person-share-row"><span class="person-series-label" style="--item-color:var(--person-series-${i})">${name}</span><strong class="od-nowrap">${fmt(value)}<small> 人</small></strong><span class="od-nowrap">${(value/total*100).toFixed(1)}%</span></div>`).join('')}</div></div>`;
}
function personnelColumns(rows){
 const max=Math.ceil(Math.max(...rows.map(r=>r[1]))/100)*100;
 const flat=`<svg class="person-columns person-chart-flat" viewBox="0 0 640 160" role="img" aria-label="今日四类人员入场：${rows.map(([n,v])=>n+v+'人').join('、')}"><title>今日分类入场，单位：人，各柱共用零起点</title>${[0,.5,1].map(r=>`<line x1="40" x2="620" y1="${122-r*116}" y2="${122-r*116}" class="person-gridline"/><text x="0" y="${127-r*116}">${Math.round(max*r)}</text>`).join('')}${rows.map(([name,value],i)=>{const x=105+i*140,h=value/max*116;return `<g tabindex="0" data-tip="${esc(name+'：'+value+' 人')}"><rect x="${x-28}" y="${122-h}" width="56" height="${h}" fill="var(--person-series-${i})"/><text x="${x}" y="${112-h}" text-anchor="middle" class="person-bar-value">${value}</text><text x="${x}" y="151" text-anchor="middle">${name.replace('人员','')}</text></g>`;}).join('')}</svg>`;
 const solid=`<svg class="person-columns person-chart-depth" viewBox="0 0 640 220" role="img" aria-label="今日四类人员入场：${rows.map(([n,v])=>n+v+'人').join('、')}"><title>实体柱正面按统一零起点读取，顶面表示厚度，单位：人</title>${[0,.5,1].map(r=>`<line x1="42" x2="622" y1="${176-r*136}" y2="${176-r*136}" class="person-gridline"/><text x="8" y="${181-r*136}">${Math.round(max*r)}</text>`).join('')}${rows.map(([name,value],i)=>{const x=110+i*140,h=value/max*136,y=176-h,left=x-24,right=x+24,tip=esc(name+'：'+value+' 人');return `<g tabindex="0" data-tip="${tip}" class="person-solid-column" style="--column-color:var(--person-series-${i})"><defs><linearGradient id="person-column-solid-${i}" x2="1" y2=".2"><stop stop-color="color-mix(in srgb,var(--column-color) 90%,white)"/><stop offset="1" stop-color="color-mix(in srgb,var(--column-color) 65%,#18304b)"/></linearGradient></defs><ellipse cx="${x+8}" cy="180" rx="43" ry="7" fill="rgba(0,8,18,.4)"/><path d="M${right},${y} l14,-10 V166 l-14,10 Z" class="person-column-side"/><rect x="${left}" y="${y}" width="48" height="${h}" fill="url(#person-column-solid-${i})"/><path d="M${left},${y} l14,-10 h48 l-14,10 Z" class="person-column-top"/><path d="M${left},${y} H${right} V176" class="person-column-edge"/><text x="${x+7}" y="${y-19}" text-anchor="middle" class="person-bar-value">${value}</text><text x="${x+5}" y="209" text-anchor="middle">${name.replace('人员','')}</text></g>`;}).join('')}</svg>`;
 return flat+solid;
}
const weeklyRoles=Object.entries(personSeries).map(([name,values])=>[name,values.reduce((sum,value)=>sum+value,0)]);
const personTrendKeys=Object.keys(personSeries);
Object.assign(panels,{
 people:{title:'在场规模',topic:'people',kind:'人员',rows:[['当前在场人数',386,'人'],['今日在场峰值',428,'人'],['当前较峰值少',42,'人'],...onSiteRoles.map(([name,value])=>[name+'在场',value,'人'])],render:()=>`<div class="person-stock od-row"><div class="person-number od-stat"><span>当前在场人数</span><strong>386<small> 人</small></strong></div><div class="person-peak od-stat"><span>今日在场峰值</span><strong>428<small> 人</small></strong><span>当前较峰值少 42 人</span></div></div>`+personnelRoleGrid(onSiteRoles)},
 peopleAffiliation:{title:'海油内 / 海油外',topic:'people',kind:'人员',rows:[['海油内',248,'人'],['海油外',138,'人'],['当前在场合计',386,'人']],render:()=>personnelShare([['海油内',248],['海油外',138]])+caption('统计对象：当前在场人员','合计 386 人')},
 peopleEntry:{title:'今日入场情况',topic:'people',kind:'人员',rows:[['今日入场人数',todayEntry,'人'],['前一日入场人数',previousEntry,'人'],...Object.entries(personSeries).map(([name,values])=>[name,values.at(-1),'人'])],render:()=>`<div class="person-entry-head od-row">${personnelNumber(todayEntry,'今日累计入场')}<div class="person-change od-field"><span>较前一日增加</span><strong>+${todayEntry-previousEntry} 人 / ${((todayEntry-previousEntry)/previousEntry*100).toFixed(1)}%</strong></div></div>`+personnelColumns(Object.entries(personSeries).map(([name,values])=>[name,values.at(-1)]))+caption('四类人员 · 统一零起点','单位：人')},
 peopleTrends:{title:'近七日分类入场趋势',topic:'people',kind:'人员',headers:['日期',...personTrendKeys],rows:days.map((d,i)=>[d,...personTrendKeys.map(name=>personSeries[name][i])]),render:()=>`<div class="person-small-multiples">${personTrendKeys.map((name,i)=>{const values=personSeries[name],change=values.at(-1)-values.at(-2);return `<section class="person-mini-trend" style="--trend-color:var(--person-series-${i})" aria-label="${name}近七日趋势"><div class="person-mini-head od-row"><strong class="person-series-label" style="--item-color:var(--person-series-${i})">${name}</strong><span class="od-nowrap"><b>${values.at(-1)}</b> 人</span><small>较前日${change>=0?'增加':'减少'} ${Math.abs(change)} 人</small></div>${personnelTrendChart(values,name)}</section>`;}).join('')}</div>`+`<div class="person-trend-dates" aria-label="趋势日期">${days.map(day=>`<span>${day}</span>`).join('')}</div>`},
 peopleWeekComposition:{title:'近七日入场构成',topic:'people',kind:'人员',rows:weeklyRoles.map(([name,value])=>[name,value,'人']),render:()=>personnelShare(weeklyRoles,true)+caption('分类七日累计 · 非独立去重人数','演示数据')}
});
 Object.assign(panels,{
  vehicleTrend:{title:'近七日在场车辆',topic:'vehicles',kind:'拖车',rows:days.map((day,i)=>[day,vehicleHistory[i],'辆']),render:()=>lineChart(vehicleHistory,null,days,['在场车辆'])+caption('按日期比较在场数量','单位：辆')},
  vehicleFlow:{title:'今日车辆进出',topic:'vehicles',kind:'拖车',rows:[...vehicleTraffic,['合计',vehicleTrafficTotal(),'车次']],render:vehicleTrafficColumns},
  vehicleObjects:{title:'作业车辆示意',topic:'vehicles',kind:'拖车',rows:points.filter(p=>['叉车','拖车','平板拖车'].includes(p.kind)).map(p=>[p.name,p.kind,p.status]),headers:['对象','类型','状态'],render:vehicleObjectList},
  mapObjects:{title:'对象查找',topic:'map',kind:'场地',headers:['对象','类型','状态'],rows:points.map(p=>[p.name,p.kind,p.status]),render:()=>`<div class="od-field object-search"><label for="object-search">名称、类型或状态</label><input id="object-search" type="search" value="${esc(objectQuery)}" placeholder="搜索名称、类型或状态" autocomplete="off"></div><div id="map-result-count" class="map-result-count" aria-live="polite"></div><div id="object-results" class="object-results">${objectResults()}</div>`},
  mapGuide:{title:'图层与定位',topic:'map',kind:'场地',rows:Object.keys(layerKinds).map(k=>[k,'示意点位','可筛选']),render:()=>`<p class="view-copy">筛选下方九类图层，点击对象查看详情。滚轮缩放、拖动平移，按 0 恢复全景。</p><p class="view-copy muted">底图保持完整比例；位置均为示意，不支持真实轨迹与地理测距。</p>`},
  channelList:{title:'监控通道',topic:'video',kind:'摄像头',headers:['通道','名称','接入状态'],rows:cameras.map((n,i)=>['CAM 0'+(i+1),n,'模拟']),render:()=>linkedRows(cameras.map((n,i)=>[n,'CAM 0'+(i+1)+' · 静态底图模拟','data-wall-channel',String(i)]))},
  videoGuide:{title:'画面与位置',topic:'video',kind:'摄像头',rows:[['画面来源','港区底图','模拟'],['真实视频流','尚未接入','状态']],render:()=>`<p class="view-copy">选择画面可放大查看，支持暂停模拟、切换通道和定位摄像头。</p>`+linkedRows(points.filter(p=>p.kind==='摄像头').map(p=>[p.name,'查看摄像头示意位置','data-locate',p.id]))},
 });
const business=createBusinessPanels({esc,fmt,metrics,bars,table,linkedRows,panels,days,productionTasks,productionSeries,tickets,shipVoyageValues,personSeries,todayEntry,vehicleHistory,vehicleTraffic,vehicleApprovalTotals,cameras});
Object.assign(panels,business.panels);
function defaultTopic(){return 'production';}
function activeView(){return topics[current];}
function mapMatchingObjects(){const q=objectQuery.trim().toLowerCase();return points.filter(p=>enabled.has(p.kind)&&(!q||(p.name+p.kind+p.status).toLowerCase().includes(q)));}
function objectResults(){
 const items=mapMatchingObjects();
 return items.length?`<div class="map-object-list">${items.map(p=>`<button class="map-object-row${selected===p.id?' is-selected':''}" data-locate="${p.id}" aria-pressed="${selected===p.id}">${icon(layerKinds[p.kind])}<span class="od-field"><strong>${esc(p.name.replace('示意',''))}</strong><small>${esc(p.kind)} · ${esc(p.status)}</small></span>${icon('arrow')}</button>`).join('')}</div>`:'<p class="view-copy">没有匹配对象，请调整关键词或开启相关图层。</p>';
}
function renderLayerControls(){
 const mapView=current==='map';
 $('#layer-controls').innerHTML=(mapView?'':'<span class="layer-caption">'+icon('layers')+' 图层</span>')+Object.entries(layerKinds).map(([kind,glyph])=>`<button class="layer-btn" data-layer="${kind}" aria-pressed="${enabled.has(kind)}">${icon(glyph)}<span>${kind}</span>${mapView?`<b>${points.filter(p=>p.kind===kind).length}</b>`:''}</button>`).join('');
}
function renderMapPanels(){
 $('#left-panels').innerHTML=`<section class="panel" data-panel="mapObjects"><div class="panel-head"><h2>对象查找</h2><button class="panel-link" data-detail="mapObjects" aria-label="查看对象查找详情">详情 ${icon('arrow')}</button></div><div class="panel-body">${panels.mapObjects.render()}</div></section>`;
 $('#right-panels').innerHTML=`<section class="panel" data-panel="mapGuide"><div class="panel-head"><h2>图层控制</h2><button class="panel-link" data-detail="mapGuide" aria-label="查看图层详情">详情 ${icon('arrow')}</button></div><div class="panel-body"><p id="map-layer-summary" class="map-scope-note"></p><div id="map-layer-slot"></div></div></section><section class="panel map-inspector"><div class="panel-head"><h2>对象信息</h2></div><div class="panel-body" id="map-selection-slot"><div id="map-selection-empty" class="map-selection-empty">${icon('area')}<strong>选择一个对象</strong><span>点击地图点位或左侧列表，查看状态与关联信息。</span></div></div></section><section class="panel map-help"><div class="panel-head"><h2>操作提示</h2></div><div class="panel-body"><div class="map-help-row"><span>平移地图</span><strong>拖动 / 方向键</strong></div><div class="map-help-row"><span>缩放地图</span><strong>滚轮 / ＋ / −</strong></div><div class="map-help-row"><span>恢复全景</span><strong>复位按钮 / 0</strong></div><p class="map-scope-note">点位与监控均为示意；不支持真实轨迹及地理测距。</p></div></section>`;
 $('#map-layer-slot').append($('#layer-controls'));
 $('#map-selection-slot').append($('#selection'));
}
function renderVideoPanels(){
 $('#left-panels').innerHTML=`<section class="panel" data-panel="channelList"><div class="panel-head"><h2>监控通道</h2><button class="panel-link" data-detail="channelList" aria-label="查看监控通道详情">详情 ${icon('arrow')}</button></div><div class="panel-body"><p class="video-scope-note">${cameras.length} 路模拟通道 · 点击切换画面</p><div class="video-channel-list">${cameras.map((name,i)=>`<button class="video-channel-card" data-wall-channel="${i}" aria-pressed="${wallChannel===i}" aria-label="切换至 CAM 0${i+1} ${name}"><span class="video-channel-thumb" style="--camera-position:${cameraPositions[i]}"><span>CAM 0${i+1}</span>${icon('camera')}</span><span class="video-channel-meta"><strong>${name}</strong><small>静态底图模拟</small></span><span class="video-channel-selected">当前通道</span></button>`).join('')}</div></div></section>`;
 $('#right-panels').innerHTML=`<section class="panel video-channel-info"><div class="panel-head"><h2>当前通道</h2></div><div class="panel-body" id="video-sidebar-info"></div></section><section class="panel video-actions-panel"><div class="panel-head"><h2>快捷操作</h2></div><div class="panel-body video-quick-actions"><button class="text-btn" data-wall-toggle></button><button class="text-btn" id="video-sidebar-enlarge" data-camera="${wallChannel}">${icon('expand')} 放大查看</button><button class="text-btn" id="video-sidebar-locate" data-locate="v${wallChannel+1}">${icon('area')} 定位到地图</button><p class="video-scope-note">定位将切换到地图页，并选中当前摄像头。</p></div></section><section class="panel video-help"><div class="panel-head"><h2>使用说明</h2><button class="panel-link" data-detail="videoGuide" aria-label="查看画面来源详情">详情 ${icon('arrow')}</button></div><div class="panel-body"><p>左侧选择通道，点击主画面可放大查看。</p><p>暂停与继续仅切换模拟状态，画面使用港区底图。</p><p class="video-scope-note">真实视频流尚未接入；不代表设备在线状态或实时监控画面。</p></div></section>`;
 syncVideoSidebar();
}
function syncVideoSidebar(){
 if(current!=='video')return;
 document.querySelectorAll('.video-channel-card').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.wallChannel)===wallChannel)));
 if($('#video-sidebar-info'))$('#video-sidebar-info').innerHTML=`<div class="video-current-title">${icon('camera')}<div><strong>${cameras[wallChannel]}</strong><span>CAM 0${wallChannel+1}</span></div></div><dl><dt>画面来源</dt><dd>港区底图</dd><dt>接入方式</dt><dd>静态模拟</dd><dt>模拟状态</dt><dd class="video-sim-state">${wallPlaying?'模拟运行中':'模拟已暂停'}</dd><dt>真实视频流</dt><dd>尚未接入</dd></dl>`;
 const pause=$('.video-quick-actions [data-wall-toggle]');if(pause)pause.innerHTML=icon(wallPlaying?'pause':'play')+(wallPlaying?' 暂停模拟':' 继续模拟');
 if($('#video-sidebar-enlarge')){const button=$('#video-sidebar-enlarge');button.dataset.camera=String(wallChannel);button.setAttribute('aria-label','放大'+cameras[wallChannel]+'模拟画面');}
 if($('#video-sidebar-locate'))$('#video-sidebar-locate').dataset.locate='v'+(wallChannel+1);
}
function updateMapSidebar(){
 if(current!=='map')return;
 const visible=points.filter(p=>enabled.has(p.kind)).length;
 if($('#map-result-count'))$('#map-result-count').textContent=`匹配 ${mapMatchingObjects().length} 个 / 图层可见 ${visible} 个 · 共 ${points.length} 个示意对象`;
 if($('#map-layer-summary'))$('#map-layer-summary').textContent=`已开启 ${enabled.size} / ${Object.keys(layerKinds).length} 类图层 · 数字为示意对象数`;
 if($('#map-selection-empty'))$('#map-selection-empty').hidden=Boolean(selected);
}

function topicSummary(){
 if(current==='map')return [['可见对象',points.filter(p=>enabled.has(p.kind)).length,'个','示意位置','area','mapObjects'],['已开启图层',enabled.size,'类','','layers','mapGuide'],['摄像通道',3,'路','模拟通道','camera','channelList']];
 return business.summary[current];
}

function renderSummary(){const rows=topicSummary();$('#summary').style.setProperty('--summary-count',rows.length);$('#summary').innerHTML=rows.map(([l,v,u,h,i,key])=>`<button class="summary-item" data-detail="${key}" aria-label="查看${l}"><span class="label">${l}</span><span class="mini-icon">${icon(i)}</span><strong class="value od-nowrap">${fmt(v)}<small class="unit">${u}</small></strong><span class="hint">${h||''}</span></button>`).join('');}
function renderNavigation(){
 $('#navigation').innerHTML=Object.entries(topics).map(([key,t])=>`<button data-topic="${key}" ${key===current?'aria-current="page"':''}>${t.name}</button>`).join('');
}
let wallChannel=0,wallPlaying=true;
function renderSceneWorkspace(){
 const view=activeView(),space=$('.scene-space');document.documentElement.dataset.layout=view.layout||'business';
 space.removeAttribute('aria-hidden');
 if(view.layout==='video'){
  space.innerHTML=`<section class="video-workspace" aria-label="监控视频工作区"><div class="wall-header od-row"><div class="od-field od-fill"><strong>${cameras[wallChannel]}</strong><small>CAM 0${wallChannel+1} · 静态底图模拟</small></div><span class="video-wall-state">${wallPlaying?'模拟运行中':'模拟已暂停'}</span></div><button class="wall-main${wallPlaying?'':' is-paused'}" data-camera="${wallChannel}" aria-label="放大${cameras[wallChannel]}模拟画面" style="--camera-position:${cameraPositions[wallChannel]}"><span class="video-screen-label">CAM 0${wallChannel+1} / ${cameras[wallChannel]}</span><span class="video-screen-expand">${icon('expand')} 点击放大</span><span class="video-screen-center">${icon(wallPlaying?'camera':'pause')}<strong>${wallPlaying?'静态底图模拟':'模拟已暂停'}</strong><small>未接入真实视频流</small></span><span class="video-screen-note">DEMO · 港区底图示意</span></button><p class="video-wall-footnote">当前画面为港区底图裁切示意，非实时监控。</p></section>`;
  syncVideoSidebar();
 }else{space.innerHTML='';space.setAttribute('aria-hidden','true');}
}
function renderPage(){
 const view=activeView();renderNavigation();renderPanels();renderSummary();renderSceneWorkspace();syncDashboardLayout();updateMarkers();
 $('#topic-label').textContent=topics[current].name;
 $('#topic-en').textContent=topics[current].en;
 $('#map-title').textContent=view.layout==='video'?'港区视频监控':view.layout==='map'?'港区地图全览':topics[current].name+' · 空间分布';
}
function locateObject(id){
 const p=points.find(x=>x.id===id);if(!p)return;
 if(activeView().layout==='video'){history.replaceState(null,'','#map');changeTopic('map');}
 enabled.add(p.kind);updateMarkers();selectPoint(id);
 // Center the selected point in the exposed center column, keeping the current zoom.
 const target=$('#map-stage').getBoundingClientRect(),surface=mapSurface().getBoundingClientRect();
 panX=(target.left+target.width/2-surface.left-surface.width/2)/previewScale-(p.x/100-.5)*baseWidth*zoom;
 panY=(target.top+target.height*.4-surface.top-surface.height/2)/previewScale-(p.y/100-.5)*baseWidth/2*zoom;paintTransform();
 document.querySelector(`[data-point="${id}"]`)?.focus({preventScroll:true});
}

renderLayerControls();
$('#markers').innerHTML=points.map(p=>`<button class="map-marker" data-point="${p.id}" data-kind="${p.kind}" data-alert="${Boolean(p.alert)}" style="--x:${p.x};--y:${p.y}" aria-label="${p.name}，${p.status}，示意位置">${icon(layerKinds[p.kind])}<span class="marker-label">${p.name.replace('示意','').replace(/ /g,'')}</span></button>`).join('');
function renderPanels(){
 restorePeoplePanels();
 document.documentElement.dataset.topic=current;
 // Move persistent controls out before replacing the sidebar; their event bindings survive.
 if($('#selection').closest('#right-panels'))$('#map-stage').append($('#selection'));
 if($('#layer-controls').closest('#right-panels'))$('.scene-ui').append($('#layer-controls'));
 renderLayerControls();
 if(current==='map'){for(const id of ['left-panels','right-panels'])$('#'+id).style.removeProperty('--layout-panel-rows');renderMapPanels();return;}
 if(current==='video'){renderVideoPanels();return;}
 const view=activeView();
 ['left-panels','right-panels'].forEach((id,index)=>{
  const wing=$('#'+id),items=index?view.right:view.left;
  wing.style.setProperty('--panel-count',items.length);
  wing.style.setProperty('--layout-panel-rows',index?view.rightRows:view.leftRows);
  wing.innerHTML=items.map(key=>{const p=panels[key];return `<section class="panel business-panel" data-panel="${key}"><div class="panel-head"><h2>${p.title}</h2><button class="panel-link" data-detail="${key}" aria-label="查看${p.title}详情">详情 ${icon('arrow')}</button></div><div class="panel-body">${p.render()}</div></section>`}).join('');
 });
}
function updateMarkers(){document.querySelectorAll('[data-point]').forEach(el=>{el.hidden=!enabled.has(el.dataset.kind);el.classList.toggle('selected',el.dataset.point===selected);el.setAttribute('aria-pressed',String(el.dataset.point===selected));});document.querySelectorAll('[data-layer]').forEach(el=>el.setAttribute('aria-pressed',String(enabled.has(el.dataset.layer))));$('#visible-count').textContent=points.filter(p=>enabled.has(p.kind)).length;if($('#object-results'))$('#object-results').innerHTML=objectResults();if(activeView().layout==='map'){renderSummary();updateMapSidebar();}}
function closeSelection(){selected=null;$('#selection').hidden=true;document.querySelectorAll('.linked').forEach(el=>el.classList.remove('linked'));updateMarkers();}
function selectPoint(id){const p=points.find(x=>x.id===id);if(!p)return;selected=id;lastPointFocus=document.querySelector(`[data-point="${id}"]`);$('#selection-title').textContent=p.name;$('#selection-info').innerHTML=`<dt>对象类型</dt><dd>${p.kind}</dd><dt>当前状态</dt><dd>${p.status}</dd><dt>所在位置</dt><dd>${p.berth||'港区示意位置'}</dd><dt>关联业务</dt><dd>${p.task||({摄像头:'视频监控',门禁:'人员车辆进出',场地:'生产与安全'}[p.kind]||'生产作业')}</dd>`;$('#selection-action').textContent=p.kind==='摄像头'?'打开模拟监控':'查看关联详情';$('#selection').hidden=false;$('.selection-actions').hidden=false;$('#selection-video').dataset.relatedCamera=p.kind==='摄像头'?String(p.channel):'';$('#selection-video').textContent=p.kind==='摄像头'?'打开模拟监控':'关联监控：暂无资料';$('#selection-video').disabled=p.kind!=='摄像头';document.querySelectorAll('.linked').forEach(el=>el.classList.remove('linked'));if(current!=='map')document.querySelectorAll('[data-panel]').forEach(el=>{const pk=panels[el.dataset.panel];if(pk.kind===p.kind||(p.kind==='场地'&&pk.topic==='safety')||(['叉车','拖车','平板拖车','汽车吊','轮胎吊'].includes(p.kind)&&pk.topic==='production'))el.classList.add('linked');});updateMarkers();}
function changeTopic(key,announce=true){
 key=resolveTopic(key);
 if(location.hash!=='#'+key)history.replaceState(null,'','#'+key);
 current=key;closeSelection();enabled=new Set(activeView().layers);renderPage();
 if(announce)$('#live-status').textContent='已切换至'+topics[key].name+'，地图视角已保留';
}
const initial=resolveTopic(location.hash.slice(1));if(location.hash!=='#'+initial)history.replaceState(null,'','#'+initial);
function setHash(key){if(location.hash==='#'+key)changeTopic(key);else location.hash=key;}
window.addEventListener('hashchange',()=>changeTopic(location.hash.slice(1)));
// V2.3 finalized: one full-port interactive panorama, contained at its natural ratio.
const stage=$('#map-stage');
const panoramaLayer=$('#panorama-layer');
const mapViewport=$('#map-viewport');
const mapWorld=$('#map-world');
function mapSurface(){return current==='map'&&activeDashboardLayout()==='wide'?mapViewport:panoramaLayer;}
function paintTransform(){
 const w=mapSurface().clientWidth,h=mapSurface().clientHeight;
 const mx=Math.max(0,(baseWidth*zoom-w)/2)+w*.15;
 const my=Math.max(0,(baseWidth/2*zoom-h)/2)+h*.15;
 panX=Math.max(-mx,Math.min(mx,panX));panY=Math.max(-my,Math.min(my,panY));
 mapWorld.style.transform=`translate(calc(-50% + ${panX}px),calc(-50% + ${panY}px)) scale(${zoom})`;
 $('#zoom-level').textContent=Math.round(zoom*100)+'%';
 $('#zoom-in').disabled=zoom>=3;$('#zoom-out').disabled=zoom<=1;
}
function fitMap(){
 const w=mapSurface().clientWidth,h=mapSurface().clientHeight;
 if(!w||!h)return;
 baseWidth=activeDashboardLayout()==='complete'?Math.min(w,h*2):['people','energy','ships','vehicles','production','safety'].includes(current)?Math.max(w,h*2):Math.min(w,h*2);
 mapWorld.style.width=baseWidth+'px';paintTransform();
}
function doZoom(delta){zoom=Math.max(1,Math.min(3,Math.round((zoom+delta)*10)/10));if(zoom===1){panX=0;panY=0;}paintTransform();}
function resetMapView(announce=true){
 zoom=1;panX=panY=0;closeSelection();fitMap();
 if(announce)toast('已恢复港区全景');
}
const mapResizeObserver=new ResizeObserver(fitMap);
mapResizeObserver.observe(stage);mapResizeObserver.observe(panoramaLayer);mapResizeObserver.observe(mapViewport);fitMap();
$('#zoom-in').addEventListener('click',()=>doZoom(.25));
$('#zoom-out').addEventListener('click',()=>doZoom(-.25));
$('#reset-map').addEventListener('click',()=>resetMapView());
function bindMapInput(surface){
 surface.addEventListener('wheel',e=>{if(e.ctrlKey||e.metaKey||e.target.closest('button,input,select,#selection'))return;e.preventDefault();doZoom(e.deltaY<0?.1:-.1);},{passive:false});
 surface.addEventListener('pointerdown',e=>{if(e.button!==0||e.target.closest('button,#selection'))return;drag={surface,id:e.pointerId,x:e.clientX,y:e.clientY,px:panX,py:panY};surface.setPointerCapture(e.pointerId);});
 surface.addEventListener('pointermove',e=>{if(!drag||drag.surface!==surface||drag.id!==e.pointerId)return;panX=drag.px+(e.clientX-drag.x)/previewScale;panY=drag.py+(e.clientY-drag.y)/previewScale;paintTransform();});
 const endDrag=e=>{if(drag&&drag.surface===surface&&drag.id===e.pointerId){if(surface.hasPointerCapture(e.pointerId))surface.releasePointerCapture(e.pointerId);drag=null;}};
 surface.addEventListener('pointerup',endDrag);surface.addEventListener('pointercancel',endDrag);
 surface.addEventListener('keydown',e=>{if(e.target!==surface)return;const moves={ArrowLeft:[40,0],ArrowRight:[-40,0],ArrowUp:[0,40],ArrowDown:[0,-40]};if(moves[e.key]){e.preventDefault();panX+=moves[e.key][0];panY+=moves[e.key][1];paintTransform();}if(e.key==='+'||e.key==='='){e.preventDefault();doZoom(.25);}if(e.key==='-'){e.preventDefault();doZoom(-.25);}if(e.key==='0'){e.preventDefault();resetMapView();}});
}
bindMapInput(stage);bindMapInput(panoramaLayer);
const peopleExtraWings={};
function restorePeoplePanels(){
 for(const key of ['peopleAffiliation','peopleEntry']){
  const wing=peopleExtraWings[key];
  if(wing?.isConnected){while(wing.firstChild)$('#left-panels').append(wing.firstChild);wing.remove();}
 }
}
function syncPreviewPopovers(){
 const preview=dashboardLayouts.has(activeDashboardLayout());
 for(const [panelId,buttonId,wrap] of [['prototype-settings-panel','prototype-settings-button','.prototype-wrap'],['theme-menu','theme-button','.theme-wrap']]){
  const panel=$('#'+panelId);
  if(preview){
   if(panel.parentElement!==document.body)document.body.append(panel);
   panel.classList.add('preview-popover');
   const rect=$('#'+buttonId).getBoundingClientRect(),width=Math.min(panelId==='theme-menu'?240:380,window.innerWidth-32);
   const top=Math.max(16,Math.min(rect.bottom+10,window.innerHeight-280));
   panel.style.width=width+'px';panel.style.left=Math.max(16,Math.min(rect.right-width,window.innerWidth-width-16))+'px';panel.style.top=top+'px';panel.style.maxHeight=Math.max(120,window.innerHeight-top-16)+'px';
  }else{
   if(panel.parentElement!==$(wrap))$(wrap).append(panel);
   panel.classList.remove('preview-popover');
   for(const property of ['width','left','top','max-height'])panel.style.removeProperty(property);
  }
 }
}
function syncDashboardLayout(){
 const active=dashboardLayouts.has(activeDashboardLayout());
 if(active)document.documentElement.dataset.dashboardLayout=activeDashboardLayout();
 else delete document.documentElement.dataset.dashboardLayout;
 previewScale=active?Math.min(window.innerWidth/3840,window.innerHeight/1080):1;
 document.documentElement.style.setProperty('--dashboard-preview-scale',previewScale);
 if(active&&activeDashboardLayout()==='columns'){
  for(const [key,label] of [['peopleAffiliation','人员归属分析'],['peopleEntry','今日入场分析']]){
   const panel=document.querySelector(`[data-panel="${key}"]`);
   const wing=peopleExtraWings[key]||(peopleExtraWings[key]=Object.assign(document.createElement('aside'),{className:'wing people-extra-wing'}));
   wing.setAttribute('aria-label',label);
   if(panel.parentElement!==wing)wing.append(panel);
   if(!wing.isConnected){if(key==='peopleAffiliation')$('#left-panels').after(wing);else $('.center').after(wing);}
  }
 }else restorePeoplePanels();
 document.querySelectorAll('[data-dashboard-layout-choice]').forEach(button=>{
  button.setAttribute('aria-pressed',String(button.dataset.dashboardLayoutChoice===activeDashboardLayout()));
 });
 $('#dashboard-layout-note').textContent='展示比例';
 if(active){
  for(const id of ['left-panels','right-panels']){
   const wing=$('#'+id);wing.style.setProperty('--layout-panel-count',wing.querySelectorAll(':scope > .panel').length);
  }
 }
 syncPageAppearance();syncPreviewPopovers();fitMap();
}
document.querySelectorAll('[data-page-style-choice]').forEach(button=>button.addEventListener('click',()=>{
 pageStyle=button.dataset.pageStyleChoice;
 try{localStorage.setItem(pageStyleKey,pageStyle);}catch{}
 syncPageAppearance();fitMap();
 $('#live-status').textContent='已切换为'+button.textContent.trim();
}));
document.querySelectorAll('[data-display-choice]').forEach(button=>button.addEventListener('click',()=>{
 dataDisplay=button.dataset.displayChoice;
 try{localStorage.setItem(dataDisplayKey,dataDisplay);}catch{}
 syncPageAppearance();
 $('#live-status').textContent='已切换为'+button.textContent.trim();
}));
document.querySelectorAll('[data-dashboard-layout-choice]').forEach(button=>button.addEventListener('click',()=>{
 const choice=button.dataset.dashboardLayoutChoice;
 dashboardLayout=choice;
 try{localStorage.setItem(dashboardLayoutKey,dashboardLayout);localStorage.removeItem('hainan-port-people-layout');}catch{}
 syncDashboardLayout();button.focus({preventScroll:true});
 $('#live-status').textContent='已切换为'+button.querySelector('strong').textContent+(dashboardLayout==='wide'?'全景布局':'标准布局');
}));
window.addEventListener('resize',()=>{if(dashboardLayouts.has(activeDashboardLayout()))syncDashboardLayout();});
const settingsPanel=$('#prototype-settings-panel'),settingsButton=$('#prototype-settings-button');
function closePrototypeSettings(returnFocus=false){settingsPanel.hidden=true;settingsButton.setAttribute('aria-expanded','false');if(returnFocus)settingsButton.focus();}
settingsButton.addEventListener('click',()=>{const open=settingsPanel.hidden;settingsPanel.hidden=!open;settingsButton.setAttribute('aria-expanded',String(open));$('#theme-menu').hidden=true;$('#theme-button').setAttribute('aria-expanded','false');if(open)$('#prototype-settings-close').focus();});
$('#prototype-settings-close').addEventListener('click',()=>closePrototypeSettings(true));
document.addEventListener('click',e=>{if(!e.target.closest('.prototype-wrap,#prototype-settings-panel'))closePrototypeSettings();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!settingsPanel.hidden&&!document.querySelector('dialog[open]')){e.preventDefault();e.stopImmediatePropagation();closePrototypeSettings(true);}},{capture:true});
$('#selection-close').addEventListener('click',()=>{closeSelection();lastPointFocus?.focus();});
$('#selection-action').addEventListener('click',()=>{const p=points.find(x=>x.id===selected);if(!p)return;if(p.kind==='摄像头')openCamera(p.channel);else openDetail(p.kind==='船舶'?'berths':p.kind==='门禁'?'approvals':p.alert?'risks':'production',p);});
const detail=$('#detail-dialog');
function showDialog(d){previousFocus=document.activeElement;d.showModal();}
function openDetail(key,pointInfo){currentPanel=key;const p=panels[key];$('#detail-title').textContent=p.title+(pointInfo?' · '+pointInfo.name:'');$('#detail-period').value='all';$('#detail-context').textContent=pointInfo?'所选对象为示意点位，下方展示关联业务演示数据。':'演示数据 · 统计日期 2026-10-22';$('#detail-search').value='';renderDetail();showDialog(detail);}
function renderDetail(){const p=panels[currentPanel],q=$('#detail-search').value.trim(),filter=$('#detail-period').value;let rows=p.rows.filter(r=>!q||r.some(x=>String(x).includes(q)));if(filter==='numeric')rows=rows.filter(r=>typeof r[1]==='number');const headers=p.headers||['指标','数值','单位'];$('#detail-content').innerHTML=(currentPanel==='prodTrend'?`<div class="detail-grid">${['柴油','灰浆','件杂货','吞吐量'].map((n,i)=>`<div><h3 style="font-size:.9rem">${n}趋势（t）</h3>${lineChart([[84,96,92,108,116,112,126],[220,240,230,280,265,296,320],[1820,1960,1900,2120,2080,2260,2414],[2100,2360,2280,2520,2410,2668,2860]][i],null,days,[n])}</div>`).join('')}</div>`:'')+(currentPanel==='berths'?linkedRows(points.filter(p=>p.kind==='船舶').map(p=>[p.name,p.berth+' · '+p.status,'data-detail-locate',p.id])):currentPanel==='vehicleObjects'?linkedRows(points.filter(p=>['叉车','拖车','平板拖车'].includes(p.kind)).map(p=>[p.name,p.status,'data-detail-locate',p.id])):currentPanel==='channelList'?linkedRows(cameras.map((name,i)=>[name,'静态底图模拟','data-detail-camera',String(i)])):'')+(rows.length?`<table class="detail-table"><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(x=>`<td>${esc(fmt(x))}</td>`).join('')}</tr>`).join('')}</tbody></table>`:'<div class="empty-state">没有符合条件的记录，请清空关键词或切换筛选条件。</div>');$('#detail-count').textContent=`共 ${rows.length} 项`;
}
$('#detail-search').addEventListener('input',renderDetail);$('#detail-period').addEventListener('change',renderDetail);
let currentCamera=0,playing=true;
function openCamera(i){currentCamera=Number(i);playing=current==='video'&&currentCamera===wallChannel?wallPlaying:true;$('#camera-channel').value=String(currentCamera);renderCamera();showDialog($('#video-dialog'));}
function renderCamera(){$('#video-title').textContent=cameras[currentCamera];$('#video-name').textContent=`CAM 0${currentCamera+1} / ${cameras[currentCamera]}`;$('#video-state').textContent=playing?'模拟监控已开启':'模拟监控已暂停';$('#video-description').textContent='使用港区底图示意，尚未接入真实视频流';$('#video-toggle').innerHTML=icon(playing?'pause':'play')+(playing?' 暂停模拟':' 继续模拟');$('#video-screen').style.backgroundPosition=cameraPositions[currentCamera];$('#video-time').textContent='演示时间 2026-10-22 16:00:00';}
$('#camera-channel').addEventListener('change',e=>{currentCamera=Number(e.target.value);if(current==='video'){wallChannel=currentCamera;playing=wallPlaying;renderSceneWorkspace();}renderCamera();});$('#video-toggle').addEventListener('click',()=>{playing=!playing;if(current==='video'&&currentCamera===wallChannel){wallPlaying=playing;renderSceneWorkspace();}renderCamera();});$('#video-locate').addEventListener('click',()=>{const p=points.find(x=>x.channel===currentCamera);$('#video-dialog').close();locateObject(p.id);});
document.querySelectorAll('dialog').forEach(d=>{d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}});d.addEventListener('close',()=>previousFocus?.isConnected&&previousFocus.focus());});
document.addEventListener('click',e=>{const t=e.target.closest('button');if(!t)return;if(t.dataset.topic)setHash(t.dataset.topic);if(t.dataset.detail)openDetail(t.dataset.detail);if(t.dataset.point)selectPoint(t.dataset.point);if(t.dataset.camera!==undefined)openCamera(t.dataset.camera);if(t.dataset.layer){const k=t.dataset.layer;if(enabled.has(k))enabled.delete(k);else enabled.add(k);if(selected&&!enabled.has(points.find(p=>p.id===selected).kind))closeSelection();updateMarkers();$('#live-status').textContent=k+'图层已'+(enabled.has(k)?'显示':'隐藏');}if(t.dataset.close)$('#'+t.dataset.close).close();});
$('#selection-video').addEventListener('click',e=>{const c=e.currentTarget.dataset.relatedCamera;if(c!=='')openCamera(Number(c));});
document.addEventListener('input',e=>{if(e.target.id==='object-search'){objectQuery=e.target.value;$('#object-results').innerHTML=objectResults();updateMapSidebar();}});
document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.cardTab){
  const key=b.dataset.cardTab,value=b.dataset.value;
  business.setChoice(key,value);
  b.closest('.panel-body').innerHTML=panels[key].render();
  document.querySelector(`[data-card-tab="${key}"][data-value="${value}"]`)?.focus({preventScroll:true});
 }
 if(b.dataset.productionSeries){trendChoice=b.dataset.productionSeries;renderPanels();document.querySelector(`[data-production-series="${trendChoice}"]`)?.focus({preventScroll:true});}
 if(b.dataset.detailLocate){detail.close();locateObject(b.dataset.detailLocate);}
 if(b.dataset.detailCamera!==undefined){detail.close();openCamera(b.dataset.detailCamera);}
 if(b.dataset.locate)locateObject(b.dataset.locate);
 if(b.dataset.wallChannel!==undefined){wallChannel=Number(b.dataset.wallChannel);renderSceneWorkspace();document.querySelector(`.video-channel-card[data-wall-channel="${wallChannel}"]`)?.focus({preventScroll:true});}
 if(b.hasAttribute('data-wall-toggle')){wallPlaying=!wallPlaying;renderSceneWorkspace();document.querySelector('[data-wall-toggle]')?.focus({preventScroll:true});}
});
const themeNames={ocean:'海蓝通透',jade:'青绿通透',lagoon:'夜澜青',amber:'暖金港湾'};
function applyTheme(value){value=({slate:'ocean',violet:'lagoon'})[value]||value;if(!themeNames[value])value='ocean';document.documentElement.dataset.theme=value;document.querySelector('meta[name="theme-color"]').content=getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();document.querySelectorAll('[data-theme-choice]').forEach(el=>el.setAttribute('aria-checked',String(el.dataset.themeChoice===value)));$('#theme-button').setAttribute('aria-label','切换配色，当前'+themeNames[value]);try{localStorage.setItem('hainan-port-panorama-v21-theme',value);}catch{}}
try{applyTheme(localStorage.getItem('hainan-port-panorama-v21-theme')||'ocean');}catch{applyTheme('ocean');}
$('#theme-button').addEventListener('click',()=>{const show=$('#theme-menu').hidden;$('#theme-menu').hidden=!show;$('#theme-button').setAttribute('aria-expanded',String(show));if(show){closePrototypeSettings();$('#theme-menu [aria-checked="true"]').focus();}});
document.querySelectorAll('[data-theme-choice]').forEach(el=>el.addEventListener('click',()=>{applyTheme(el.dataset.themeChoice);$('#theme-menu').hidden=true;$('#theme-button').setAttribute('aria-expanded','false');$('#theme-button').focus();toast('已切换为'+themeNames[el.dataset.themeChoice]);}));
document.addEventListener('click',e=>{if(!e.target.closest('.theme-wrap,#theme-menu')){$('#theme-menu').hidden=true;$('#theme-button').setAttribute('aria-expanded','false');}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){$('#theme-menu').hidden=true;$('#theme-button').setAttribute('aria-expanded','false');if(!detail.open&&!$('#video-dialog').open)closeSelection();}});
$('#fullscreen-button').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{toast('当前环境不支持全屏，请在独立浏览器窗口打开');}});
function clock(){const n=new Date();$('#time').textContent=n.toLocaleTimeString('zh-CN',{hour12:false});$('#date').textContent=n.toLocaleDateString('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit',weekday:'long'});}
clock();setInterval(clock,1000);
const tooltip=$('#chart-tooltip');
function tipFor(el,x,y){tooltip.textContent=el.dataset.tip;tooltip.hidden=false;tooltip.style.left=Math.min(x+12,window.innerWidth-240)+'px';tooltip.style.top=Math.max(8,Math.min(y+12,window.innerHeight-100))+'px';}
document.addEventListener('pointerover',e=>{const t=e.target.closest('[data-tip]');if(t)tipFor(t,e.clientX,e.clientY);});document.addEventListener('pointerout',e=>{if(e.target.closest('[data-tip]'))tooltip.hidden=true;});document.addEventListener('focusin',e=>{if(e.target.dataset.tip){const r=e.target.getBoundingClientRect();tipFor(e.target,r.left,r.bottom);}});document.addEventListener('focusout',()=>tooltip.hidden=true);
changeTopic(initial,false);
$('#port-image').addEventListener('error',()=>{$('#map-note').textContent='港区底图加载失败，请保留背景图.png与入口文件的相对位置';});
})();
