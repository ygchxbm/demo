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
const energyKwh=[38620,40180,39480,42060,41240,43120,42860];
const carbonDaily=[6.2,7.1,6.8,7.6,7.4,8.1,7.82];
const todayKwh=energyKwh.at(-1),prevKwh=energyKwh.at(-2),kwhDelta=todayKwh-prevKwh;
const peakKwh=Math.max(...energyKwh),peakDay=days[energyKwh.indexOf(peakKwh)];
const kwhPct=(Math.abs(kwhDelta)/prevKwh*100).toFixed(1);
const kwhChange=`较前一日${kwhDelta>=0?'增加':'减少'} ${Math.abs(kwhDelta)} kWh / ${kwhPct}%`;
const peakGap=peakKwh-todayKwh;
const peakGapNote=peakGap===0?'与七日峰值持平':`较峰值${peakGap>0?'少':'多'} ${Math.abs(peakGap)} kWh · ${peakDay}`;
const gridKwh=32100,solarSelf=10760,solarExport=2100,solarGen=solarSelf+solarExport;
const shoreBerths=[['01 号泊位',3280],['02 号泊位',2860],['03 号泊位',2500]];
const shoreTotal=shoreBerths.reduce((sum,[,n])=>sum+n,0);
const solarHours=['00时','04时','08时','12时','16时','20时','24时'];
const solarCurve=[0,820,2480,4860,3620,1080,0];
const fuels=[['柴油',18.6,'t'],['淡水',326,'m³'],['LNG',42.5,'t']];
const metrics = rows => `<div class="metrics" style="--cols:${Math.min(rows.length,3)}">${rows.map(([label,value,unit=''])=>`<div class="metric od-stat"><span class="metric-label">${label}</span><strong class="metric-value od-nowrap">${fmt(value)}<small>${unit}</small></strong></div>`).join('')}</div>`;
let chartSerial=0;
function lineChart(values, values2, labels=days, names=['入场人数','作业人员']){
 const chartId='chart-fill-'+(++chartSerial);
 const max=Math.ceil(Math.max(...values,...(values2||[]))*1.15/10)*10, n=values.length;
 const pts=v=>v.map((x,i)=>[32+i*308/(n-1),94-x/max*73]);
 const p=pts(values), q=values2?pts(values2):[];
 const path=v=>v.map((a,i)=>(i?'L':'M')+a.join(',')).join(' ');
 return `<svg class="chart" viewBox="0 0 370 124" role="img" aria-label="${esc(names.join('与'))}趋势，${esc(values.join('、'))}"><title>${esc(names[0])}趋势（演示）</title><defs><linearGradient id="${chartId}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--accent)" stop-opacity=".13"/><stop offset="1" stop-color="var(--accent)" stop-opacity=".005"/></linearGradient></defs>${[0,.5,1].map(x=>`<line class="gridline" x1="32" y1="${94-x*73}" x2="340" y2="${94-x*73}"/><text x="0" y="${98-x*73}" style="font-size:10px">${Math.round(max*x)}</text>`).join('')}<path d="${path(p)} L340,94 L32,94 Z" fill="url(#${chartId})"/><path class="line-a" d="${path(p)}"/>${q.length?`<path class="line-b" d="${path(q)}"/>`:''}${p.map(([x,y],i)=>`<g data-tip="${esc(labels[i]+'\n'+names[0]+'：'+values[i]+(values2?'\n'+names[1]+'：'+values2[i]:''))}" tabindex="0"><circle cx="${x}" cy="${y}" r="8" fill="transparent"/><circle cx="${x}" cy="${y}" r="2.5" fill="var(--accent)"/><text x="${x}" y="115" text-anchor="middle" style="font-size:10px">${esc(labels[i])}</text></g>`).join('')}</svg>`;
}
function bars(rows,max){max=max||Math.max(...rows.map(x=>x[1]));return `<div class="bar-list" style="--max:${max}">${rows.map(([name,v,unit=''])=>`<div class="bar-row"><span>${name}</span><div class="bar-track"><div class="bar-fill" style="--value:${v}"></div></div><b class="od-nowrap">${fmt(v)}${unit}</b></div>`).join('')}</div>`;}
function donut(value,label,rows){const c=276.46;return `<div class="chart-layout"><div class="donut"><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="49" fill="none" stroke="var(--accent)" stroke-width=".5" opacity=".08" stroke-dasharray="2 5"/><circle cx="50" cy="50" r="37" fill="none" stroke="var(--accent)" stroke-width=".5" opacity=".06"/><circle cx="50" cy="50" r="44" fill="none" stroke="var(--border)" stroke-width="3"/><circle cx="50" cy="50" r="44" fill="none" stroke="var(--accent)" stroke-width="3" stroke-dasharray="${value/100*c} ${c}" stroke-linecap="round"/><circle cx="50" cy="50" r="44" fill="none" stroke="var(--accent2)" stroke-width="3" stroke-dasharray="${Math.min(9,value)/100*c} ${c}" stroke-dashoffset="${-Math.max(0,value-9)/100*c}"/></svg><div class="od-stat"><strong>${value}%</strong><small>${label}</small></div></div><div class="breakdown">${rows.map(([k,v])=>`<div class="breakdown-row"><span>${k}</span><b>${v}</b></div>`).join('')}</div></div>`;}
const table=(headers,rows)=>`<table class="status-table"><thead><tr>${headers.map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(x=>`<td>${x}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
const caption=(a,b='今日 · 演示')=>`<div class="chart-caption"><span>${a}</span><span>${b}</span></div>`;
const tickets=[['能源隔离',3],['动火',4],['有限空间',2],['吊装',8],['高处',5],['临时用电',2]];
const ticketGrid=()=>`<div class="ticket-list">${tickets.map(([k,v])=>`<div class="ticket-item"><span>${k}</span><b>${v}</b></div>`).join('')}</div>`;
const panels={
 production:{title:'生产作业',topic:'production',kind:'场地',rows:[['作业完成率',86.7,'%'],['任务数',120,'单'],['接单数',116,'单'],['已完成',104,'单'],['管输任务',36,'单'],['场地任务',48,'单'],['泊位任务',36,'单']],render:()=>donut(86.7,'作业完成率',[['任务总数','120 单'],['已接单','116 单'],['已完成','104 单']])+bars([['管输',36],['场地',48],['泊位',36]],60)},
 ships:{title:'船舶动态',topic:'ships',kind:'船舶',rows:[['服务船舶数量',26,'艘'],['服务航次',38,'航次'],['当日在港',12,'艘'],['今日船舶峰值',16,'艘']],render:()=>metrics([['服务船舶',26,'艘'],['当日在港',12,'艘'],['今日峰值',16,'艘']])+lineChart([27,32,29,35,31,36,38],null,days,['航次'])+caption('近七日航次动态','今日 38 航次')},
 safety:{title:'安全控制',topic:'safety',kind:'场地',rows:[['今日作业许可量',24,'项'],['作业票数量',24,'张'],...tickets.map(([k,v])=>[k,v,'张'])],render:()=>metrics([['今日许可',24,'项'],['作业票',24,'张'],['执行中',9,'项']])+ticketGrid()},
 vehicles:{title:'车辆动态',topic:'people',kind:'拖车',rows:[['在场车辆',86,'辆'],['今日进场车次',142,'车次'],['今日出场车次',126,'车次'],['出门审批待审',3,'单'],['出门审批已通过',18,'单']],render:()=>metrics([['在场车辆',86,'辆'],['进出车次',268,'车次'],['待审批',3,'单']])+lineChart([62,74,68,81,79,91,86],null,days,['在场车辆'])+caption('近七日在场车辆','单位：辆')},
 approvals:{title:'出门审批',topic:'people',kind:'门禁',rows:[['CM-1022-021','作业车辆','待审批'],['CM-1022-020','物资运输','待审批'],['CM-1022-019','设备出场','待审批'],['CM-1022-018','作业车辆','已通过']],headers:['申请编号','类型','状态'],render:()=>metrics([['待审批',3,'单'],['已通过',18,'单'],['已驳回',1,'单']])+table(['申请单号','类型','状态'],[['…021','作业车辆','待审批'],['…020','物资运输','待审批'],['…019','设备出场','待审批']])},
 voyages:{title:'航次动态趋势',topic:'ships',kind:'船舶',rows:days.map((d,i)=>[d,[27,32,29,35,31,36,38][i],'航次']),render:()=>lineChart([27,32,29,35,31,36,38],null,days,['航次'])+caption('近七日航次统计','单位：航次')},
 berths:{title:'在港船舶',topic:'ships',kind:'船舶',headers:['船舶编号','泊位（示意）','状态'],rows:[['示意船舶 A01','01 号泊位','装卸中'],['示意船舶 A02','02 号泊位','加油中'],['示意船舶 A03','03 号泊位','待作业'],['示意船舶 A04','04 号泊位','装卸中']],render:()=>linkedRows(points.filter(p=>p.kind==='船舶').map(p=>[p.name.replace('示意船舶 ',''),p.berth+' · '+p.status,'data-locate',p.id]))},
 shipWork:{title:'船舶作业指标',topic:'production',kind:'船舶',rows:[['年吞吐量',128.6,'万吨'],['装卸效率',186,'t/h'],['船舶平均在岗时间',8.4,'h']],render:()=>metrics([['年吞吐量',128.6,'万吨'],['装卸效率',186,'t/h'],['平均在岗',8.4,'h']])+caption('统计口径沿用原功能表','示例指标')},
 shipPeak:{title:'在港数量变化',topic:'ships',kind:'船舶',rows:[['00:00',8,'艘'],['04:00',10,'艘'],['08:00',14,'艘'],['12:00',16,'艘'],['16:00',12,'艘']],render:()=>lineChart([8,10,14,16,12],null,['00:00','04:00','08:00','12:00','16:00'],['在港船舶'])+caption('今日在港峰值 16 艘','单位：艘')},
 cargo:{title:'卸装作业',topic:'production',kind:'场地',rows:[['卸装件数',1248,'件'],['卸装吨数',2860,'t'],['卸装船次',16,'船次']],render:()=>metrics([['卸装件数',1248,'件'],['卸装吨数',2860,'t'],['卸装船次',16,'船次']])+bars([['已完成',14],['作业中',2]],16)+caption('卸装船次状态')},
 fuel:{title:'加油作业',topic:'production',kind:'船舶',rows:[['柴油储存',680,'t'],['加油吨数',126,'t'],['加油船次',10,'船次']],render:()=>metrics([['柴油储存',680,'t'],['加油吨数',126,'t'],['加油船次',10,'船次']])+lineChart([84,96,92,108,116,112,126],null,days,['加油吨数'])+caption('近七日加油量','单位：t')},
 ash:{title:'输灰作业',topic:'production',kind:'场地',rows:[['输送反打船次',8,'船次'],['输送船次',6,'船次'],['反打船次',2,'船次']],render:()=>metrics([['输送反打',8,'船次'],['输送',6,'船次'],['反打',2,'船次']])+bars([['输送',6],['反打',2]],8)+caption('业务名称沿用原表')},
 prodTrend:{title:'生产趋势',topic:'production',kind:'场地',headers:['业务','今日','昨日'],rows:[['柴油（t）',126,112],['灰浆（t）',320,296],['件杂货（t）',2414,2260],['吞吐量（t）',2860,2668]],render:()=>strip(Object.keys(productionSeries),'data-production-series',trendChoice)+lineChart(productionSeries[trendChoice],null,days,[trendChoice])+caption('近七日'+trendChoice,'单位：t')},
 electricity:{title:'今日用电',topic:'energy',kind:'场地',rows:[['今日总用电',todayKwh,'kWh'],['前一日用电',prevKwh,'kWh'],['较前一日',kwhDelta,'kWh'],['近七日峰值',peakKwh,'kWh'],['峰值日期',peakDay,''],['较峰值',todayKwh-peakKwh,'kWh'],['购电量',gridKwh,'kWh'],['光伏自用电',solarSelf,'kWh'],['岸电',shoreTotal,'kWh']],render:()=>sbDual({label:'今日总用电',value:todayKwh,unit:'kWh',note:kwhChange},{label:'近七日峰值',value:peakKwh,unit:'kWh',note:peakGapNote},true)+sbChips([['购电',gridKwh],['光伏自用',solarSelf],['岸电',shoreTotal]],'kWh')},
 powerMix:{title:'用电构成',topic:'energy',kind:'场地',rows:[['购电量',gridKwh,'kWh'],['光伏自用电',solarSelf,'kWh'],['总用电量',gridKwh+solarSelf,'kWh'],['岸电',shoreTotal,'kWh'],['岸电口径','未计入环内','单独统计']],render:()=>sbDonut([['购电',gridKwh],['光伏自用',solarSelf]],'总计用电',{unit:'kWh',tight:true})+caption('岸电未计入环内',fmt(shoreTotal)+' kWh 单独统计')},
 todayItems:{title:'今日分项',topic:'energy',kind:'场地',rows:[...[['购电',gridKwh],['光伏自用',solarSelf],['岸电',shoreTotal],['外送',solarExport]].map(([name,value])=>[name,value,'kWh']),['光伏发电',solarGen,'kWh'],...shoreBerths.map(([name,value])=>[name+'岸电',value,'kWh']),['柱图口径','四项不相加','购电与光伏自用合计为总用电']],render:()=>sbColumns([['购电',gridKwh],['光伏自用',solarSelf],['岸电',shoreTotal],['外送',solarExport]],{unit:'kWh',step:10000,aria:'今日分项电量：购电'+gridKwh+'、光伏自用'+solarSelf+'、岸电'+shoreTotal+'、外送'+solarExport+'，单位 kWh，柱间不相加',title:max=>`今日分项电量，单位 kWh，各柱共用零起点但不互加，刻度上限 ${max}`})+sbChips(shoreBerths,'kWh')+caption('购电 + 光伏自用 = 总用电','岸电按泊位拆开，外送单独统计')},
 solarBalance:{title:'今日光伏平衡',topic:'energy',kind:'场地',rows:[['总发电量',solarGen,'kWh'],['光伏自用电',solarSelf,'kWh'],['外送电量',solarExport,'kWh'],...solarHours.map((hour,i)=>[hour+'发电',solarCurve[i],'kWh']),...fuels.map(([name,value,unit])=>[name+'消耗',value,unit])],render:()=>sbDonut([['光伏自用',solarSelf,1],['外送电量',solarExport,2]],'总发电量',{unit:'kWh'})+sbFuels(fuels)},
 energyTrend:{title:'近七日趋势',topic:'energy',kind:'场地',rows:[...days.map((d,i)=>[d+' 用电',energyKwh[i],'kWh']),...days.map((d,i)=>[d+' 碳减排',carbonDaily[i],'tCO₂']),['本月碳减排',186.4,'tCO₂'],['本年碳减排',2148.6,'tCO₂'],['排放因子','未设定','演示'],['岸电',shoreTotal,'kWh'],['光伏发电',solarGen,'kWh'],['岸电与光伏发电','仅今日','无七日序列']],render:()=>sbSparks([['总用电',energyKwh,'kWh'],['碳减排',carbonDaily,'tCO₂']],{chartHeight:84,delta:(change,_name,_values,unit)=>{const digits=Number.isInteger(change)?0:2,amount=Math.round(Math.abs(change)*10**digits)/10**digits;return `较前日${change>=0?'增加':'减少'} ${amount} ${unit}`;}})+sbToday([['岸电',shoreTotal,'kWh'],['光伏发电',solarGen,'kWh']])},
 equipment:{title:'关键重要设备',topic:'safety',kind:'场地',headers:['设备','总数 / 可用 / 停用 / 在用','完好率'],rows:[['消防水泵','8 / 8 / 0 / 2','100%'],['空压机','12 / 11 / 1 / 6','91.7%'],['生活水泵','6 / 6 / 0 / 3','100%']],render:()=>table(['设备','总数 / 在用','完好率'],[['消防水泵','8 / 2','100%'],['空压机','12 / 6','91.7%'],['生活水泵','6 / 3','100%']])+caption('点击详情查看可用、停用数量')},
 availability:{title:'设备可靠性',topic:'safety',kind:'场地',rows:[['设备总数',26,'台'],['年可用率',98.6,'%'],['当前完好率',96.2,'%'],['可用设备',25,'台'],['停用设备',1,'台'],['在用设备',11,'台']],render:()=>donut(96.2,'设备完好率',[['总数','26 台'],['年可用率','98.6%'],['在用','11 台']])+caption('可用 25 台 · 停用 1 台')},
 permits:{title:'作业许可记录',topic:'safety',kind:'场地',headers:['票号','作业类型','状态'],rows:[['PT-1022-024','吊装','执行中'],['PT-1022-023','动火','执行中'],['PT-1022-022','有限空间','待开始'],['PT-1022-021','高处','已结束']],render:()=>table(['作业票','类型','状态'],[['…024','吊装','执行中'],['…023','动火','执行中'],['…022','有限空间','待开始'],['…021','高处','已结束']])},
 risks:{title:'重点关注',topic:'safety',kind:'场地',headers:['事项','位置（示意）','状态'],rows:[['空压机停用','设备区','检修中'],['吊装作业','03 号场地','执行中'],['动火作业','维修区','执行中']],render:()=>linkedRows([['空压机停用','示意设备区 · 检修中','data-locate','a3'],['吊装作业','示意场地 B区 · 执行中','data-locate','a2'],['出门申请','3 单待审批 · 待办事项','data-detail','approvals']])},
 safetyTrend:{title:'作业票趋势',topic:'safety',kind:'场地',rows:days.map((d,i)=>[d,[18,22,20,26,23,21,24][i],'张']),render:()=>lineChart([18,22,20,26,23,21,24],null,days,['作业票'])+caption('近七日高风险作业票','单位：张')}
};
const topics={
 people:{name:'人员动态',en:'PERSONNEL DYNAMICS',panels:['people','peopleAffiliation','peopleEntry','peopleTrends','peopleWeekComposition'],layers:['门禁']},
 energy:{name:'能耗监测',en:'ENERGY & CARBON MONITORING',panels:['electricity','powerMix','todayItems','energyTrend','solarBalance'],layers:['场地','船舶']},
 ships:{name:'船舶动态',en:'VESSEL DYNAMICS',panels:['ships','voyages','berths','shipPeak'],layers:['船舶','摄像头']},
 vehicles:{name:'车辆动态',en:'VEHICLE DYNAMICS',panels:['vehicles','vehicleFlow','approvals','vehicleObjects'],layers:['拖车','平板拖车','叉车','门禁']},
 map:{name:'地图',en:'PORT MAP EXPLORER',panels:['mapObjects','mapGuide'],layers:['叉车','船舶','拖车','平板拖车','汽车吊','轮胎吊','摄像头','门禁','场地'],layout:'map'},
 video:{name:'监控视频',en:'VIDEO MONITORING',panels:['channelList','videoGuide'],layers:['摄像头'],layout:'video'},
 production:{name:'生产状态',en:'PRODUCTION OPERATIONS',panels:['production','shipWork','cargo','fuel','ash','prodTrend'],layers:['场地','叉车','拖车','平板拖车','汽车吊','轮胎吊','船舶']},
 safety:{name:'安全控制',en:'SAFETY & EQUIPMENT MONITORING',panels:['safety','equipment','availability','permits','risks','safetyTrend'],layers:['场地','摄像头','门禁','汽车吊','轮胎吊']}
};
const layerKinds={'叉车':'forklift','船舶':'ship','拖车':'truck','平板拖车':'truck','汽车吊':'crane','轮胎吊':'crane','摄像头':'camera','门禁':'gate','场地':'area'};
const point=(id,kind,x,y,name,status='正常',extra={})=>({id,kind,x,y,name,status,...extra});
const points=[
 point('s1','船舶',20,20,'示意船舶 A01','装卸中',{berth:'01 号泊位',task:'件杂货装卸'}),point('s2','船舶',53,43,'示意船舶 A02','加油中',{berth:'02 号泊位',task:'柴油加注'}),point('s3','船舶',61,39,'示意船舶 A03','待作业',{berth:'03 号泊位',task:'输灰'}),point('s4','船舶',75,32,'示意船舶 A04','装卸中',{berth:'04 号泊位',task:'物资装卸'}),
 point('f1','叉车',34,44,'示意叉车 F01','作业中'),point('f2','叉车',44,59,'示意叉车 F02','空闲'),point('t1','拖车',39,64,'示意拖车 T01','运输中'),point('t2','拖车',67,56,'示意拖车 T02','运输中'),point('p1','平板拖车',49,72,'示意平板车 P01','作业中'),point('c1','汽车吊',31,32,'示意汽车吊 C01','作业中'),point('c2','轮胎吊',51,57,'示意轮胎吊 C02','作业中'),
 point('v1','摄像头',27,30,'01 泊位监控','模拟通道',{channel:0}),point('v2','摄像头',47,66,'作业区监控','模拟通道',{channel:1}),point('v3','摄像头',69,71,'出入口监控','模拟通道',{channel:2}),point('g1','门禁',58,74,'示意门岗 G01','正常'),point('g2','门禁',79,64,'示意门岗 G02','正常'),point('a1','场地',40,39,'示意场地 A区','正常'),point('a2','场地',58,57,'示意场地 B区','吊装作业',{alert:true}),point('a3','场地',34,61,'示意设备区','检修中',{alert:true})
];
const cameras=['01 泊位监控','作业区监控','出入口监控'];
let current='people', selected=null, enabled=new Set(topics.people.layers), zoom=1,panX=0,panY=0,baseWidth=0, drag=null, lastPointFocus=null, currentPanel=null, previousFocus=null;
// V2.3: finalized eight-menu organization and version 1 menu buttons.
let trendChoice='吞吐量',objectQuery='';
const personSeries={'管理人员':[104,112,108,120,116,124,128],'作业人员':[242,281,260,306,294,321,334],'参观访问':[38,40,42,44,40,45,46],'船舶相关':[102,99,98,105,98,106,104]};
const productionSeries={'柴油':[84,96,92,108,116,112,126],'灰浆':[220,240,230,280,265,296,320],'件杂货':[1820,1960,1900,2120,2080,2260,2414],'吞吐量':[2100,2360,2280,2520,2410,2668,2860]};
const strip=(items,attr,active)=>`<div class="view-switch" role="group">${items.map(k=>`<button ${attr}="${esc(k)}" aria-pressed="${k===active}">${esc(k)}</button>`).join('')}</div>`;
function linkedRows(rows){return `<div class="linked-rows od-stack">${rows.map(([title,detail,attr,value])=>`<button ${attr}="${value}" class="linked-row od-row"><span class="od-field od-fill"><strong>${esc(title)}</strong><small>${esc(detail)}</small></span>${icon('arrow')}</button>`).join('')}</div>`;}
// Personnel data has distinct stocks (currently on site) and flows (daily entries).
const onSiteRoles=[['管理',96],['作业',214],['参观访问',24],['船舶相关',52]];
const onSiteTotal=onSiteRoles.reduce((sum,[,n])=>sum+n,0);
const onSitePeak=428;
const onSiteGap=onSitePeak-onSiteTotal;
const affiliation=[['海油内',248],['海油外',138]];
const affiliationTotal=affiliation.reduce((sum,[,n])=>sum+n,0);
const dailyEntries=days.map((_,i)=>Object.values(personSeries).reduce((sum,series)=>sum+series[i],0));
const todayEntry=dailyEntries.at(-1),previousEntry=dailyEntries.at(-2);
const entryDelta=todayEntry-previousEntry;
const entryPct=(Math.abs(entryDelta)/previousEntry*100).toFixed(1);
const peakNote=onSiteGap>0?`当前较峰值少 ${onSiteGap} 人`:onSiteGap<0?`当前较峰值多 ${-onSiteGap} 人`:'与今日峰值持平';
function sbKpi(item){
 if(item.delta)return `<div class="sb-delta od-field"><span>${esc(item.label)}</span><strong class="od-nowrap">${esc(item.delta)}</strong></div>`;
 const value=`<strong${item.lead?' class="od-nowrap"':''}>${fmt(item.value)}<small> ${esc(item.unit)}</small></strong>`;
 const label=`<span>${esc(item.label)}</span>`;
 const note=item.note?`<span class="sb-note">${esc(item.note)}</span>`:'';
 return `<div class="sb-kpi od-stat">${item.lead?value+label:label+value}${note}</div>`;
}
function sbDual(left,right,tight){return `<div class="sb-dual${tight?' sb-dual-tight':''}">${sbKpi(left)}${sbKpi(right)}</div>`;}
function sbChips(rows,unit){const style=rows.length===4?'':` style="--sb-chip-cols:${rows.length}"`;return `<div class="sb-chips"${style}>${rows.map(([label,value,rowUnit],i)=>`<div class="od-stat"><span class="sb-dot" style="--item-color:var(--sb-series-${i})">${esc(label)}</span><strong class="od-nowrap">${fmt(value)}<small> ${esc(rowUnit||unit)}</small></strong></div>`).join('')}</div>`;}
function sbDonut(rows,center,{unit='人',tight=false}={}){
 const total=rows.reduce((sum,[,n])=>sum+n,0),radius=72,circumference=2*Math.PI*radius;
 let offset=0;
 const geometry=rows.map(([name,value,color],i)=>{
  const slot=color??i,info=esc(name+'：'+value+' '+unit+'，'+(value/total*100).toFixed(1)+'%');
  const dash=`${Math.max(0,value/total*circumference-2)} ${circumference}`,shift=-(offset/total*circumference);
  offset+=value;
  return `<circle cx="100" cy="100" r="${radius}" fill="none" stroke="var(--sb-series-${slot})" stroke-width="13" stroke-dasharray="${dash}" stroke-dashoffset="${shift}" transform="rotate(-90 100 100)" tabindex="0" data-tip="${info}"><title>${info}</title></circle>`;
 }).join('');
 const viewBox=tight?'18 18 164 164':'0 0 200 200';
 return `<div class="sb-donut"><div class="sb-donut-graphic"><svg viewBox="${viewBox}" role="img" aria-label="${esc(center+'，合计 '+total+' '+unit)}"><circle cx="100" cy="100" r="72" fill="none" stroke="rgba(255,255,255,.16)" stroke-width="13"/>${geometry}</svg><div class="sb-donut-center od-stat"><strong>${fmt(total)}</strong><span>${esc(center)}</span></div></div><div class="sb-legend">${rows.map(([name,value,color],i)=>{const slot=color??i;return `<div class="sb-legend-row"><span class="sb-dot" style="--item-color:var(--sb-series-${slot})">${esc(name)}</span><strong class="od-nowrap">${fmt(value)}<small> ${esc(unit)}</small></strong><span class="od-nowrap">${(value/total*100).toFixed(1)}%</span></div>`;}).join('')}</div></div>`;
}
function sbColumns(rows,{unit='人',step=100,aria,title}={}){
 const max=Math.ceil(Math.max(...rows.map(r=>r[1]))/step)*step||1,left=46,right=628,base=236,top=24,plot=base-top;
 const guides=[0,.5,1].map(r=>{const y=base-r*plot;return `<line class="sb-gridline" x1="${left}" x2="${right}" y1="${y}" y2="${y}"/><text x="2" y="${y+5}">${Math.round(max*r)}</text>`;}).join('');
 const cols=rows.map(([name,value,short],i)=>{const x=left+(i+.5)*(right-left)/rows.length,h=Math.max(value/max*plot,1),w=48;return `<g tabindex="0" data-tip="${esc(name+'：'+value+' '+unit)}"><rect x="${x-w/2}" y="${base-h}" width="${w}" height="${h}" rx="1.5" fill="var(--sb-series-${i})"/><text x="${x}" y="${base-h-8}" text-anchor="middle" class="sb-bar-value">${value}</text><text x="${x}" y="${base+24}" text-anchor="middle">${esc(short??name)}</text></g>`;}).join('');
 const ariaText=aria||rows.map(([name,value])=>name+value+unit).join('、');
 const titleText=title?title(max):`分类对比，单位：${unit}，各柱共用零起点，刻度上限 ${max}`;
 return `<svg class="sb-columns" viewBox="0 0 640 268" preserveAspectRatio="none" role="img" aria-label="${esc(ariaText)}"><title>${esc(titleText)}</title>${guides}${cols}</svg>`;
}
function sbSparkline(values,name,opt){
 const unit=opt.unit??'人',labels=opt.labels??days;
 const min=Math.min(...values),max=Math.max(...values),span=Math.max(max-min,1),w=280,n=values.length,h=opt.chartHeight??32,plot=h-14;
 const coords=values.map((value,i)=>[((i+.5)/n)*w,6+(max-value)/span*plot]);
 const path=coords.map(([x,y],i)=>(i?'L':'M')+x.toFixed(1)+','+y.toFixed(1)).join(' ');
 const aria=(opt.aria||((label,series)=>label+'：'+series.join('、')+unit))(name,values);
 const title=(opt.title||((label,lo,hi)=>label+'趋势，纵轴单位为'+unit+'，范围 '+lo+'–'+hi))(name,min,max);
 const tip=opt.tip||((label,seriesName,value)=>label+'\n'+seriesName+'：'+value+' '+unit);
 return `<svg class="sb-spark-chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(aria)}"><title>${esc(title)}</title><path d="${path}" class="sb-spark-line"/>${coords.map(([x,y],i)=>`<g tabindex="0" data-tip="${esc(tip(labels[i],name,values[i]))}"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6" fill="transparent"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.2" class="sb-spark-dot"/></g>`).join('')}</svg>`;
}
function sbSparks(items,opt={}){
 const fallback=opt.unit??'人',labels=opt.labels??days;
 const delta=opt.delta||((change,_name,_values,unit)=>`${change>=0?'+':''}${change} ${unit}`);
 const sectionLabel=opt.sectionLabel||(name=>name+'近七日趋势');
 const rows=items.map(([name,values,rowUnit],i)=>{const unit=rowUnit||fallback,change=values.at(-1)-values.at(-2);return `<section class="sb-spark" style="--trend-color:var(--sb-series-${i})" aria-label="${esc(sectionLabel(name))}"><div class="sb-spark-head"><strong class="sb-dot" style="--item-color:var(--sb-series-${i})">${esc(name)}</strong><b class="od-nowrap">${fmt(values.at(-1))}<small> ${esc(unit)}</small></b><small class="sb-spark-delta">${esc(delta(change,name,values,unit))}</small></div>${sbSparkline(values,name,{...opt,unit})}</section>`;}).join('');
 return `<div class="sb-sparks${opt.chartHeight?' sb-sparks-tall':''}">${rows}<div class="sb-axis">${labels.map(day=>`<span>${esc(day)}</span>`).join('')}</div></div>`;
}
function sbToday(rows){
 return `<div class="sb-today"><p class="sb-note">仅今日 · 无七日序列</p><div class="sb-today-grid">${rows.map(([label,value,unit],i)=>`<div class="od-stat"><span class="sb-dot" style="--item-color:var(--sb-series-${i+2})">${esc(label)}</span><strong class="od-nowrap">${fmt(value)}<small> ${esc(unit)}</small></strong></div>`).join('')}</div></div>`;
}
function sbFuels(rows){
 return `<div class="sb-fuels"><p class="sb-note">今日油气水 · 单位各不相同</p>${rows.map(([name,value,unit],i)=>`<div class="sb-fuel"><span class="sb-dot" style="--item-color:var(--sb-series-${i})">${esc(name)}</span><b class="od-nowrap">${fmt(value)}<small> ${esc(unit)}</small></b></div>`).join('')}</div>`;
}
const weeklyRoles=Object.entries(personSeries).map(([name,values])=>[name,values.reduce((sum,value)=>sum+value,0)]);
const personTrendKeys=Object.keys(personSeries);
const entryBars=Object.entries(personSeries).map(([name,values])=>[name,values.at(-1),name.replace('人员','')]);
Object.assign(panels,{
 people:{title:'在场规模',topic:'people',kind:'人员',rows:[['当前在场人数',onSiteTotal,'人'],['今日在场峰值',onSitePeak,'人'],['当前较峰值少',onSiteGap,'人'],...onSiteRoles.map(([name,value])=>[name+'在场',value,'人'])],render:()=>sbDual({label:'当前在场人数',value:onSiteTotal,unit:'人'},{label:'今日在场峰值',value:onSitePeak,unit:'人',note:peakNote},true)+sbChips(onSiteRoles,'人')},
 peopleAffiliation:{title:'海油内 / 海油外',topic:'people',kind:'人员',rows:[...affiliation.map(([name,value])=>[name,value,'人']),['当前在场合计',affiliationTotal,'人']],render:()=>sbDonut(affiliation,'总计人数',{tight:true})},
 peopleEntry:{title:'今日入场情况',topic:'people',kind:'人员',rows:[['今日入场人数',todayEntry,'人'],['前一日入场人数',previousEntry,'人'],...Object.entries(personSeries).map(([name,values])=>[name,values.at(-1),'人'])],render:()=>sbDual({label:'今日累计入场',value:todayEntry,unit:'人',lead:true},{label:`较前一日${entryDelta>=0?'增加':'减少'}`,delta:`${entryDelta>0?'+':''}${entryDelta} 人 / ${entryPct}%`})+sbColumns(entryBars,{aria:'今日四类人员入场：'+entryBars.map(([name,value])=>name+value+'人').join('、'),title:max=>`今日分类入场，单位：人，各柱共用零起点，刻度上限 ${max}`})},
 peopleTrends:{title:'近七日分类入场趋势',topic:'people',kind:'人员',headers:['日期',...personTrendKeys],rows:days.map((d,i)=>[d,...personTrendKeys.map(name=>personSeries[name][i])]),render:()=>sbSparks(personTrendKeys.map(name=>[name,personSeries[name]]),{delta:change=>`较前日${change>=0?'增加':'减少'} ${Math.abs(change)} 人`,aria:(name,values)=>`${name}近七日入场人数：${values.join('、')}人`,title:(name,min,max)=>`${name}近七日入场趋势，纵轴单位为人，范围 ${min}–${max}`,tip:(day,name,value)=>`${day}\n${name}入场：${value} 人`})},
 peopleWeekComposition:{title:'近七日入场构成',topic:'people',kind:'人员',rows:weeklyRoles.map(([name,value])=>[name,value,'人']),render:()=>sbDonut(weeklyRoles,'七日累计入场')}
});
 Object.assign(panels,{
  vehicleFlow:{title:'今日车辆进出',topic:'vehicles',kind:'拖车',rows:[['进场',142,'车次'],['出场',126,'车次'],['合计',268,'车次']],render:()=>bars([['进场',142,'车次'],['出场',126,'车次']],160)+caption('进出合计 268 车次','今日')},
  vehicleObjects:{title:'作业车辆示意',topic:'vehicles',kind:'拖车',rows:points.filter(p=>['叉车','拖车','平板拖车'].includes(p.kind)).map(p=>[p.name,p.kind,p.status]),headers:['对象','类型','状态'],render:()=>linkedRows(points.filter(p=>['拖车','平板拖车'].includes(p.kind)).map(p=>[p.name,p.status+' · 示意位置','data-locate',p.id]))},
  mapObjects:{title:'对象查找',topic:'map',kind:'场地',headers:['对象','类型','状态'],rows:points.map(p=>[p.name,p.kind,p.status]),render:()=>`<div class="od-field object-search"><label for="object-search">名称或类型</label><input id="object-search" type="search" value="${esc(objectQuery)}" placeholder="搜索船舶、门禁等" autocomplete="off"></div><div id="object-results" class="object-results">${objectResults()}</div>`},
  mapGuide:{title:'图层与定位',topic:'map',kind:'场地',rows:Object.keys(layerKinds).map(k=>[k,'示意点位','可筛选']),render:()=>`<p class="view-copy">筛选下方九类图层，点击对象查看详情。滚轮缩放、拖动平移，按 0 恢复全景。</p><p class="view-copy muted">底图保持完整比例；位置均为示意，不支持真实轨迹与地理测距。</p>`},
  channelList:{title:'监控通道',topic:'video',kind:'摄像头',headers:['通道','名称','接入状态'],rows:cameras.map((n,i)=>['CAM 0'+(i+1),n,'模拟']),render:()=>linkedRows(cameras.map((n,i)=>[n,'CAM 0'+(i+1)+' · 静态底图模拟','data-wall-channel',String(i)]))},
  videoGuide:{title:'画面与位置',topic:'video',kind:'摄像头',rows:[['画面来源','港区底图','模拟'],['真实视频流','尚未接入','状态']],render:()=>`<p class="view-copy">选择画面可放大查看，支持暂停模拟、切换通道和定位摄像头。</p>`+linkedRows(points.filter(p=>p.kind==='摄像头').map(p=>[p.name,'查看摄像头示意位置','data-locate',p.id]))},
 });
function defaultTopic(){return 'people';}
function activeView(){return topics[current];}
function objectResults(){const q=objectQuery.trim().toLowerCase(),items=points.filter(p=>enabled.has(p.kind)&&(!q||(p.name+p.kind+p.status).toLowerCase().includes(q)));return items.length?linkedRows(items.map(p=>[p.name,p.kind+' · '+p.status,'data-locate',p.id])):'<p class="view-copy">没有匹配对象，请调整关键词或开启相关图层。</p>';}
function topicSummary(){
 const view=activeView();
 if(current==='people')return [['当前在场',onSiteTotal,'人','','people','people'],['今日峰值',onSitePeak,'人','','people','people'],['今日入场',todayEntry,'人','','people','peopleEntry'],['海油内',affiliation[0][1],'人','','people','peopleAffiliation'],['海油外',affiliation[1][1],'人','','people','peopleAffiliation']];
 if(current==='energy')return [['今日用电',todayKwh,'kWh','','bolt','electricity'],['购电',gridKwh,'kWh','','bolt','powerMix'],['光伏发电',solarGen,'kWh','','bolt','solarBalance'],['岸电',shoreTotal,'kWh','','bolt','todayItems'],['今日碳减排',carbonDaily.at(-1),'tCO₂','','bolt','energyTrend']];
 if(view.layout==='map')return [['可见对象',points.filter(p=>enabled.has(p.kind)).length,'个','示意位置','area','mapObjects'],['图层类型',9,'类','','layers','mapGuide'],['摄像通道',3,'路','模拟通道','camera','channelList']];
 if(view.layout==='video')return [['模拟通道',3,'路','','camera','channelList'],['真实接入',0,'路','','camera','videoGuide']];
 const keys={vehicles:['vehicles','vehicleFlow','approvals'],ships:['ships','voyages','berths'],safety:['safety','permits'],production:['production','shipWork','cargo']}[current];
 return keys.flatMap(k=>panels[k].rows.filter(r=>typeof r[1]==='number').slice(0,2).map(([l,v,u])=>[l,v,u,'','chart',k])).slice(0,6);
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
  space.innerHTML=`<section class="video-workspace" aria-label="监控视频工作区"><div class="wall-header od-row"><div class="od-field od-fill"><strong>${cameras[wallChannel]}</strong><small>CAM 0${wallChannel+1} · 静态底图模拟，未接入视频流</small></div><button class="text-btn" data-wall-toggle>${wallPlaying?'暂停模拟':'继续模拟'}</button></div><button class="wall-main" data-camera="${wallChannel}" aria-label="放大${cameras[wallChannel]}模拟画面" style="--camera-position:${['20% 30%','48% 58%','75% 70%'][wallChannel]}"><span class="od-field"><strong>${icon(wallPlaying?'camera':'pause')} ${wallPlaying?'模拟画面':'模拟已暂停'}</strong><small>点击放大 · 使用港区底图示意</small></span></button><div class="wall-rail">${cameras.map((n,i)=>`<button data-wall-channel="${i}" aria-pressed="${i===wallChannel}" class="od-field"><strong>CAM 0${i+1}</strong><span>${n}</span></button>`).join('')}</div><button class="text-btn" data-locate="v${wallChannel+1}">定位当前摄像头到地图 ${icon('arrow')}</button></section>`;
 }else{space.innerHTML='';space.setAttribute('aria-hidden','true');}
}
function renderPage(){
 const view=activeView();renderNavigation();renderPanels();renderSummary();renderSceneWorkspace();updateMarkers();
 $('#topic-label').textContent=topics[current].name;
 $('#topic-en').textContent=topics[current].en;
 $('#map-title').textContent=view.layout==='video'?'港区视频监控':view.layout==='map'?'港区地图全览':topics[current].name+' · 空间分布';
}
function locateObject(id){
 const p=points.find(x=>x.id===id);if(!p)return;
 if(activeView().layout==='video'){history.replaceState(null,'','#map');changeTopic('map');}
 enabled.add(p.kind);updateMarkers();selectPoint(id);
 // Center the selected point in the exposed center column, keeping the current zoom.
 const target=$('#map-stage').getBoundingClientRect(),surface=$('#panorama-layer').getBoundingClientRect();
 panX=target.left+target.width/2-surface.left-surface.width/2-(p.x/100-.5)*baseWidth*zoom;
 panY=target.top+target.height*.4-surface.top-surface.height/2-(p.y/100-.5)*baseWidth/2*zoom;paintTransform();
 document.querySelector(`[data-point="${id}"]`)?.focus({preventScroll:true});
}

$('#navigation').innerHTML=Object.entries(topics).map(([key,t])=>`<button data-topic="${key}" ${key===current?'aria-current="page"':''}>${t.name}</button>`).join('');
$('#layer-controls').innerHTML='<span class="layer-caption">'+icon('layers')+' 图层</span>'+Object.entries(layerKinds).map(([kind,i])=>`<button class="layer-btn" data-layer="${kind}" aria-pressed="${enabled.has(kind)}">${icon(i)}<span>${kind}</span></button>`).join('');
$('#markers').innerHTML=points.map(p=>`<button class="map-marker" data-point="${p.id}" data-kind="${p.kind}" data-alert="${Boolean(p.alert)}" style="--x:${p.x};--y:${p.y}" aria-label="${p.name}，${p.status}，示意位置">${icon(layerKinds[p.kind])}<span class="marker-label">${p.name.replace('示意','').replace(/ /g,'')}</span></button>`).join('');
function renderPanels(){
 const root=document.documentElement;
 root.dataset.topic=current;
 if(current==='people'||current==='energy')root.dataset.sidebar='airy';else delete root.dataset.sidebar;
 const keys=activeView().panels,half=Math.ceil(keys.length/2);
 ['left-panels','right-panels'].forEach((id,index)=>{const wing=$('#'+id),items=keys.slice(index*half,index*half+half);wing.style.setProperty('--panel-count',items.length);wing.innerHTML=items.map(key=>{const p=panels[key];return `<section class="panel" data-panel="${key}"><div class="panel-head"><h2>${p.title}</h2><button class="panel-link" data-detail="${key}" aria-label="查看${p.title}详情">详情 ${icon('arrow')}</button></div><div class="panel-body">${p.render()}</div></section>`}).join('');});
}
function updateMarkers(){document.querySelectorAll('[data-point]').forEach(el=>{el.hidden=!enabled.has(el.dataset.kind);el.classList.toggle('selected',el.dataset.point===selected);el.setAttribute('aria-pressed',String(el.dataset.point===selected));});document.querySelectorAll('[data-layer]').forEach(el=>el.setAttribute('aria-pressed',String(enabled.has(el.dataset.layer))));$('#visible-count').textContent=points.filter(p=>enabled.has(p.kind)).length;if($('#object-results'))$('#object-results').innerHTML=objectResults();if(activeView().layout==='map')renderSummary();}
function closeSelection(){selected=null;$('#selection').hidden=true;document.querySelectorAll('.linked').forEach(el=>el.classList.remove('linked'));updateMarkers();}
function selectPoint(id){const p=points.find(x=>x.id===id);if(!p)return;selected=id;lastPointFocus=document.querySelector(`[data-point="${id}"]`);$('#selection-title').textContent=p.name;$('#selection-info').innerHTML=`<dt>对象类型</dt><dd>${p.kind}</dd><dt>当前状态</dt><dd>${p.status}</dd><dt>所在位置</dt><dd>${p.berth||'港区示意位置'}</dd><dt>关联业务</dt><dd>${p.task||({摄像头:'视频监控',门禁:'人员车辆进出',场地:'生产与安全'}[p.kind]||'生产作业')}</dd>`;$('#selection-action').textContent=p.kind==='摄像头'?'打开模拟监控':'查看关联详情';$('#selection').hidden=false;$('.selection-actions').hidden=false;$('#selection-video').dataset.relatedCamera=p.kind==='摄像头'?String(p.channel):'';$('#selection-video').textContent=p.kind==='摄像头'?'打开模拟监控':'关联监控：暂无资料';$('#selection-video').disabled=p.kind!=='摄像头';document.querySelectorAll('.linked').forEach(el=>el.classList.remove('linked'));document.querySelectorAll('[data-panel]').forEach(el=>{const pk=panels[el.dataset.panel];if(pk.kind===p.kind||(p.kind==='场地'&&pk.topic==='safety')||(['叉车','拖车','平板拖车','汽车吊','轮胎吊'].includes(p.kind)&&pk.topic==='production'))el.classList.add('linked');});updateMarkers();}
function changeTopic(key,announce=true){
 if(!topics[key])key=defaultTopic();
 current=key;closeSelection();enabled=new Set(activeView().layers);renderPage();
 if(announce)$('#live-status').textContent='已切换至'+topics[key].name+'，地图视角已保留';
}
const initial=location.hash.slice(1);if(!topics[initial])history.replaceState(null,'','#'+defaultTopic());changeTopic(topics[initial]?initial:defaultTopic(),false);
function setHash(key){if(location.hash==='#'+key)changeTopic(key);else location.hash=key;}
window.addEventListener('hashchange',()=>changeTopic(location.hash.slice(1)));
// V2.3 finalized: one full-port interactive panorama, contained at its natural ratio.
const stage=$('#map-stage');
const panoramaLayer=$('#panorama-layer');
const mapWorld=$('#map-world');
function paintTransform(){
 const w=panoramaLayer.clientWidth,h=panoramaLayer.clientHeight;
 const mx=Math.max(0,(baseWidth*zoom-w)/2)+w*.15;
 const my=Math.max(0,(baseWidth/2*zoom-h)/2)+h*.15;
 panX=Math.max(-mx,Math.min(mx,panX));panY=Math.max(-my,Math.min(my,panY));
 mapWorld.style.transform=`translate(calc(-50% + ${panX}px),calc(-50% + ${panY}px)) scale(${zoom})`;
 $('#zoom-level').textContent=Math.round(zoom*100)+'%';
 $('#zoom-in').disabled=zoom>=3;$('#zoom-out').disabled=zoom<=1;
}
function fitMap(){
 const w=panoramaLayer.clientWidth,h=panoramaLayer.clientHeight;
 if(!w||!h)return;
 baseWidth=Math.min(w,h*2);
 mapWorld.style.width=baseWidth+'px';paintTransform();
}
function doZoom(delta){zoom=Math.max(1,Math.min(3,Math.round((zoom+delta)*10)/10));if(zoom===1){panX=0;panY=0;}paintTransform();}
function resetMapView(announce=true){
 zoom=1;panX=panY=0;closeSelection();fitMap();
 if(announce)toast('已恢复港区全景');
}
const mapResizeObserver=new ResizeObserver(fitMap);
mapResizeObserver.observe(stage);mapResizeObserver.observe(panoramaLayer);fitMap();
$('#zoom-in').addEventListener('click',()=>doZoom(.25));
$('#zoom-out').addEventListener('click',()=>doZoom(-.25));
$('#reset-map').addEventListener('click',()=>resetMapView());
function bindMapInput(surface){
 surface.addEventListener('wheel',e=>{if(e.ctrlKey||e.metaKey||e.target.closest('button,input,select,#selection'))return;e.preventDefault();doZoom(e.deltaY<0?.1:-.1);},{passive:false});
 surface.addEventListener('pointerdown',e=>{if(e.button!==0||e.target.closest('button,#selection'))return;drag={surface,id:e.pointerId,x:e.clientX,y:e.clientY,px:panX,py:panY};surface.setPointerCapture(e.pointerId);});
 surface.addEventListener('pointermove',e=>{if(!drag||drag.surface!==surface||drag.id!==e.pointerId)return;panX=drag.px+e.clientX-drag.x;panY=drag.py+e.clientY-drag.y;paintTransform();});
 const endDrag=e=>{if(drag&&drag.surface===surface&&drag.id===e.pointerId){if(surface.hasPointerCapture(e.pointerId))surface.releasePointerCapture(e.pointerId);drag=null;}};
 surface.addEventListener('pointerup',endDrag);surface.addEventListener('pointercancel',endDrag);
 surface.addEventListener('keydown',e=>{if(e.target!==surface)return;const moves={ArrowLeft:[40,0],ArrowRight:[-40,0],ArrowUp:[0,40],ArrowDown:[0,-40]};if(moves[e.key]){e.preventDefault();panX+=moves[e.key][0];panY+=moves[e.key][1];paintTransform();}if(e.key==='+'||e.key==='='){e.preventDefault();doZoom(.25);}if(e.key==='-'){e.preventDefault();doZoom(-.25);}if(e.key==='0'){e.preventDefault();resetMapView();}});
}
bindMapInput(stage);bindMapInput(panoramaLayer);
const settingsPanel=$('#prototype-settings-panel'),settingsButton=$('#prototype-settings-button');
function closePrototypeSettings(returnFocus=false){settingsPanel.hidden=true;settingsButton.setAttribute('aria-expanded','false');if(returnFocus)settingsButton.focus();}
settingsButton.addEventListener('click',()=>{const open=settingsPanel.hidden;settingsPanel.hidden=!open;settingsButton.setAttribute('aria-expanded',String(open));$('#theme-menu').hidden=true;$('#theme-button').setAttribute('aria-expanded','false');if(open)$('#prototype-settings-close').focus();});
$('#prototype-settings-close').addEventListener('click',()=>closePrototypeSettings(true));
document.addEventListener('click',e=>{if(!e.target.closest('.prototype-wrap'))closePrototypeSettings();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!settingsPanel.hidden&&!document.querySelector('dialog[open]')){e.preventDefault();e.stopImmediatePropagation();closePrototypeSettings(true);}},{capture:true});
$('#selection-close').addEventListener('click',()=>{closeSelection();lastPointFocus?.focus();});
$('#selection-action').addEventListener('click',()=>{const p=points.find(x=>x.id===selected);if(!p)return;if(p.kind==='摄像头')openCamera(p.channel);else openDetail(p.kind==='船舶'?'berths':p.kind==='门禁'?'approvals':p.alert?'risks':'production',p);});
const detail=$('#detail-dialog');
function showDialog(d){previousFocus=document.activeElement;d.showModal();}
function openDetail(key,pointInfo){currentPanel=key;const p=panels[key];$('#detail-title').textContent=p.title+(pointInfo?' · '+pointInfo.name:'');$('#detail-period').value='all';$('#detail-context').textContent=pointInfo?'所选对象为示意点位，下方展示关联业务演示数据。':'演示数据 · 统计日期 2026-10-22';$('#detail-search').value='';renderDetail();showDialog(detail);}
function renderDetail(){const p=panels[currentPanel],q=$('#detail-search').value.trim(),filter=$('#detail-period').value;let rows=p.rows.filter(r=>!q||r.some(x=>String(x).includes(q)));if(filter==='numeric')rows=rows.filter(r=>typeof r[1]==='number');const headers=p.headers||['指标','数值','单位'];$('#detail-content').innerHTML=(currentPanel==='prodTrend'?`<div class="detail-grid">${['柴油','灰浆','件杂货','吞吐量'].map((n,i)=>`<div><h3 style="font-size:.9rem">${n}趋势（t）</h3>${lineChart([[84,96,92,108,116,112,126],[220,240,230,280,265,296,320],[1820,1960,1900,2120,2080,2260,2414],[2100,2360,2280,2520,2410,2668,2860]][i],null,days,[n])}</div>`).join('')}</div>`:'')+(rows.length?`<table class="detail-table"><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(x=>`<td>${esc(fmt(x))}</td>`).join('')}</tr>`).join('')}</tbody></table>`:'<div class="empty-state">没有符合条件的记录，请清空关键词或切换筛选条件。</div>');$('#detail-count').textContent=`共 ${rows.length} 项`;
}
$('#detail-search').addEventListener('input',renderDetail);$('#detail-period').addEventListener('change',renderDetail);
let currentCamera=0,playing=true;
function openCamera(i){currentCamera=Number(i);playing=true;$('#camera-channel').value=String(currentCamera);renderCamera();showDialog($('#video-dialog'));}
function renderCamera(){$('#video-title').textContent=cameras[currentCamera];$('#video-name').textContent=`CAM 0${currentCamera+1} / ${cameras[currentCamera]}`;$('#video-state').textContent=playing?'模拟监控已开启':'模拟监控已暂停';$('#video-description').textContent='使用港区底图示意，尚未接入真实视频流';$('#video-toggle').innerHTML=icon(playing?'pause':'play')+(playing?' 暂停模拟':' 继续模拟');$('#video-screen').style.backgroundPosition=['20% 30%','48% 58%','75% 70%'][currentCamera];$('#video-time').textContent='演示时间 2026-10-22 16:00:00';}
$('#camera-channel').addEventListener('change',e=>{currentCamera=Number(e.target.value);renderCamera();});$('#video-toggle').addEventListener('click',()=>{playing=!playing;renderCamera();});$('#video-locate').addEventListener('click',()=>{const p=points.find(x=>x.channel===currentCamera);$('#video-dialog').close();locateObject(p.id);});
document.querySelectorAll('dialog').forEach(d=>{d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}});d.addEventListener('close',()=>previousFocus?.isConnected&&previousFocus.focus());});
document.addEventListener('click',e=>{const t=e.target.closest('button');if(!t)return;if(t.dataset.topic)setHash(t.dataset.topic);if(t.dataset.detail)openDetail(t.dataset.detail);if(t.dataset.point)selectPoint(t.dataset.point);if(t.dataset.camera!==undefined)openCamera(t.dataset.camera);if(t.dataset.layer){const k=t.dataset.layer;if(enabled.has(k))enabled.delete(k);else enabled.add(k);if(selected&&!enabled.has(points.find(p=>p.id===selected).kind))closeSelection();updateMarkers();$('#live-status').textContent=k+'图层已'+(enabled.has(k)?'显示':'隐藏');}if(t.dataset.close)$('#'+t.dataset.close).close();});
$('#selection-video').addEventListener('click',e=>{const c=e.currentTarget.dataset.relatedCamera;if(c!=='')openCamera(Number(c));});
document.addEventListener('input',e=>{if(e.target.id==='object-search'){objectQuery=e.target.value;$('#object-results').innerHTML=objectResults();}});
document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.productionSeries){trendChoice=b.dataset.productionSeries;renderPanels();document.querySelector(`[data-production-series="${trendChoice}"]`)?.focus({preventScroll:true});}
 if(b.dataset.locate)locateObject(b.dataset.locate);
 if(b.dataset.wallChannel!==undefined){wallChannel=Number(b.dataset.wallChannel);renderSceneWorkspace();document.querySelector(`.wall-rail [data-wall-channel="${wallChannel}"]`)?.focus({preventScroll:true});}
 if(b.hasAttribute('data-wall-toggle')){wallPlaying=!wallPlaying;renderSceneWorkspace();document.querySelector('[data-wall-toggle]')?.focus({preventScroll:true});}
});
const themeNames={ocean:'海蓝通透',jade:'青绿通透',slate:'蓝灰通透'};
function applyTheme(value){if(!themeNames[value])value='ocean';document.documentElement.dataset.theme=value;document.querySelectorAll('[data-theme-choice]').forEach(el=>el.setAttribute('aria-checked',String(el.dataset.themeChoice===value)));$('#theme-button').setAttribute('aria-label','切换配色，当前'+themeNames[value]);try{localStorage.setItem('hainan-port-panorama-v21-theme',value);}catch{}}
try{applyTheme(localStorage.getItem('hainan-port-panorama-v21-theme')||'ocean');}catch{applyTheme('ocean');}
$('#theme-button').addEventListener('click',()=>{const show=$('#theme-menu').hidden;$('#theme-menu').hidden=!show;$('#theme-button').setAttribute('aria-expanded',String(show));if(show)$('#theme-menu button').focus();});
document.querySelectorAll('[data-theme-choice]').forEach(el=>el.addEventListener('click',()=>{applyTheme(el.dataset.themeChoice);$('#theme-menu').hidden=true;$('#theme-button').setAttribute('aria-expanded','false');$('#theme-button').focus();toast('已切换为'+themeNames[el.dataset.themeChoice]);}));
document.addEventListener('click',e=>{if(!e.target.closest('.theme-wrap')){$('#theme-menu').hidden=true;$('#theme-button').setAttribute('aria-expanded','false');}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){$('#theme-menu').hidden=true;$('#theme-button').setAttribute('aria-expanded','false');if(!detail.open&&!$('#video-dialog').open)closeSelection();}});
$('#fullscreen-button').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{toast('当前环境不支持全屏，请在独立浏览器窗口打开');}});
function clock(){const n=new Date();$('#time').textContent=n.toLocaleTimeString('zh-CN',{hour12:false});$('#date').textContent=n.toLocaleDateString('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit',weekday:'long'});}
clock();setInterval(clock,1000);
const tooltip=$('#chart-tooltip');
function tipFor(el,x,y){tooltip.textContent=el.dataset.tip;tooltip.hidden=false;tooltip.style.left=Math.min(x+12,window.innerWidth-240)+'px';tooltip.style.top=Math.max(8,Math.min(y+12,window.innerHeight-100))+'px';}
document.addEventListener('pointerover',e=>{const t=e.target.closest('[data-tip]');if(t)tipFor(t,e.clientX,e.clientY);});document.addEventListener('pointerout',e=>{if(e.target.closest('[data-tip]'))tooltip.hidden=true;});document.addEventListener('focusin',e=>{if(e.target.dataset.tip){const r=e.target.getBoundingClientRect();tipFor(e.target,r.left,r.bottom);}});document.addEventListener('focusout',()=>tooltip.hidden=true);
$('#port-image').addEventListener('error',()=>{$('#map-note').textContent='港区底图加载失败，请保留背景图.png与入口文件的相对位置';});
})();
