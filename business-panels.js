'use strict';
/* Four-topic demo cards. All new figures are illustrative, not live service data. */
window.createBusinessPanels = function ({esc,fmt,metrics,bars,table,linkedRows,panels,days,productionTasks,productionSeries,tickets,shipVoyageValues,personSeries,todayEntry,vehicleHistory,vehicleTraffic,vehicleApprovalTotals,cameras}) {
 const choices={};
 const percent=(value,total)=>Number((value/total*100).toFixed(1));
 const sum=rows=>rows.reduce((n,r)=>n+r[1],0);
 const note=text=>`<p class="business-note">${text}</p>`;
 const heading=(label,unit)=>`<div class="business-section"><span>${label}</span><small>${unit}</small></div>`;
 const links=rows=>`<div class="business-links">${rows.map(([label,key])=>`<button class="text-btn" data-detail="${key}">${label} ↗</button>`).join('')}</div>`;
 const tabs=(key,values)=>{const active=choices[key]||values[0];return `<div class="business-tabs" role="group" aria-label="${newPanels[key].title}图表指标">${values.map(value=>`<button data-card-tab="${key}" data-value="${value}" aria-pressed="${active===value}">${value}</button>`).join('')}</div>`;};
 const trendRows=(series,labels=days)=>Object.entries(series).flatMap(([name,{values,unit}])=>values.map((value,i)=>[labels[i]+' · '+name,value,unit]));
 function chart(series,labels=days){
  const entries=Object.entries(series),max=Math.max(1,...entries.flatMap(([,s])=>s.values))*1.15,width=400,left=35,right=387,top=16,bottom=103;
  return `<svg class="business-chart" viewBox="0 0 ${width} 132" role="img" aria-label="${esc(entries.map(([name,s])=>name+'，单位'+s.unit+'：'+s.values.join('、')).join('；'))}">${[0,.5,1].map(p=>`<line class="gridline" x1="${left}" x2="${right}" y1="${bottom-(bottom-top)*p}" y2="${bottom-(bottom-top)*p}"/><text x="27" y="${bottom-(bottom-top)*p+4}" text-anchor="end">${Math.round(max*p)}</text>`).join('')}${entries.map(([name,s],j)=>{const pts=s.values.map((v,i)=>[left+i*(right-left)/(labels.length-1),bottom-v/max*(bottom-top)]);return `<polyline class="person-chart-flat" points="${pts.map(p=>p.join(',')).join(' ')}" fill="none" stroke="var(--person-series-${j})" stroke-width="2.5"/><g class="person-chart-depth"><polyline class="person-solid-rail-shadow" points="${pts.map(([x,y])=>[x,y+4].join(',')).join(' ')}"/><polyline class="person-solid-rail" stroke="var(--person-series-${j})" points="${pts.map(p=>p.join(',')).join(' ')}"/><polyline class="person-solid-rail-glint" points="${pts.map(([x,y])=>[x,y-1].join(',')).join(' ')}"/></g>${pts.map(([x,y],i)=>`<g tabindex="0" data-tip="${esc(labels[i]+' · '+name+'：'+fmt(s.values[i])+' '+s.unit)}"><circle cx="${x}" cy="${y}" r="9" fill="transparent"/><circle cx="${x}" cy="${y}" r="3" fill="var(--person-series-${j})"/></g>`).join('')}`;}).join('')}${labels.map((label,i)=>`<text x="${left+i*(right-left)/(labels.length-1)}" y="124" text-anchor="middle">${label}</text>`).join('')}</svg>`;
 }
 const trend=(series,labels=days)=>heading(Object.keys(series).join(' / '),'单位：'+Object.values(series)[0].unit)+chart(series,labels);
 const throughput={year:128.6,month:13.82,efficiency:182.4,yoy:6.8,mom:3.2,series:{'吞吐量':{values:productionSeries['吞吐量'],unit:'t'},'白天装卸量':{values:[1400,1560,1480,1620,1610,1768,1860],unit:'t'},'夜间装卸量':{values:[700,800,800,900,800,900,1000],unit:'t'},'作业效率':{values:[172,176,174,180,178,184,186],unit:'t/h'}}};
 const ships={annual:6824,voyages:8620,shiftRate:8.6,series:{'总航次':{values:shipVoyageValues,unit:'航次'},'移泊率':{values:[7.4,8.2,7.8,9.1,8.5,8.8,8.6],unit:'%'},'平均在港时长':{values:[9.2,8.9,9.1,8.7,8.8,8.5,8.4],unit:'h'}}};
 const areas=[['罐区',48,' 张'],['码头前沿',42,' 张'],['集装箱堆场',36,' 张'],['散货库区',28,' 张']];
 const yard={types:[['库房',86000,'m²'],['堆场',268000,'m²'],['车间',46000,'m²']],tenants:[['有限公司',142000,'m²'],['中海油服',98000,'m²'],['其他单位',52000,'m²']]};
 yard.total=sum(yard.types);yard.rented=sum(yard.tenants);yard.rate=percent(yard.rented,yard.total);
 const monthLabels=['5月','6月','7月','8月','9月','10月'];
 const chemical={series:{'月平均库存':{values:[620,658,641,692,704,680],unit:'t'},'周转率':{values:[68,72,70,76,79,78],unit:'%'},'高危化学品周转率':{values:[61,65,64,69,73,71],unit:'%'}}};
 const hidden={severity:[['重大隐患',2,'项'],['一般隐患',28,'项']],states:[['待整改',8,'项'],['待验收',6,'项'],['已验收',16,'项']],overdue:3};
 const equipment=[{name:'消防水泵',total:8,attendance:6,hours:6.4,utilization:80},{name:'空压机',total:12,attendance:10,hours:6.8,utilization:85},{name:'生活水泵',total:6,attendance:5,hours:5.6,utilization:70}];
 const equipmentTotals={total:equipment.reduce((n,e)=>n+e.total,0),attendance:equipment.reduce((n,e)=>n+e.attendance,0)};
 equipmentTotals.hours=Number((equipment.reduce((n,e)=>n+e.hours*e.attendance,0)/equipmentTotals.attendance).toFixed(1));
 equipmentTotals.utilization=Number((equipment.reduce((n,e)=>n+e.utilization*e.attendance,0)/equipmentTotals.attendance).toFixed(1));
 equipmentTotals.rate=percent(equipmentTotals.attendance,equipmentTotals.total);
 const devices={types:[['摄像头',128,'台'],['无人机',4,'台'],['车载设备',36,'台'],['定位卡',420,'张']],normal:[142,156,148,168,161,175,170],abnormal:[3,4,2,5,3,4,2]};
 const inspection={normal:devices.normal.at(-1),abnormal:devices.abnormal.at(-1)};inspection.total=inspection.normal+inspection.abnormal;
 const inspectionSeries={'巡检总数':{values:devices.normal.map((n,i)=>n+devices.abnormal[i]),unit:'次'},'正常巡检':{values:devices.normal,unit:'次'},'异常巡检':{values:devices.abnormal,unit:'次'}};
 const events=[['设备告警','设备区空压机停用','10/22 15:42','a3'],['作业告警','B区吊装区域告警','10/22 15:28','a2'],['区域告警','门岗通道异常通行','10/22 14:56','g1'],['巡检告警','作业区巡检发现异常','10/22 14:30','v2']];
 const ai={categories:[['人员类',8640,'次'],['车辆类',6280,'次'],['区域类',3120,'次'],['作业类',2360,'次'],['火情类',1200,'次']],exceptions:[['人员类',8],['车辆类',5],['区域类',4],['作业类',6],['火情类',1]],algorithms:12,channels:96};ai.total=sum(ai.categories);ai.abnormal=sum(ai.exceptions);
 const vehicleTypes=[['货运车辆',42,' 辆'],['工程车辆',24,' 辆'],['公务车辆',12,' 辆'],['危化品车',8,' 辆']];
 const card=(title,topic,kind,rows,render,extra={})=>({title,topic,kind,rows,render,...extra});
 const newPanels={
  throughput:card('港口吞吐量','production','船舶',[
   ['本年吞吐量',throughput.year,'万吨'],['本月吞吐量',throughput.month,'万吨'],['本年作业效率',throughput.efficiency,'t/h'],['本月吞吐量同比',throughput.yoy,'%'],['本月吞吐量环比',throughput.mom,'%'],...trendRows(throughput.series)
  ],()=>metrics([['本年吞吐量',throughput.year,'万吨'],['本月吞吐量',throughput.month,'万吨'],['本年作业效率',throughput.efficiency,'t/h']])+note(`本月吞吐量：同比 +${throughput.yoy}%　环比 +${throughput.mom}%`)+tabs('throughput',['吞吐量','昼夜装卸','作业效率'])+trend(choices.throughput==='昼夜装卸'?{'白天装卸量':throughput.series['白天装卸量'],'夜间装卸量':throughput.series['夜间装卸量']}:{[choices.throughput||'吞吐量']:throughput.series[choices.throughput||'吞吐量']})),
  shipService:card('船舶服务','production','船舶',[
   ['今日服务船舶',panels.ships.rows[0][1],'艘'],['本年度服务船舶',ships.annual,'艘'],['当日在港',panels.ships.rows[2][1],'艘'],['本年航次',ships.voyages,'航次'],['今日移泊率',ships.shiftRate,'%'],['今日平均在港时长',ships.series['平均在港时长'].values.at(-1),'h'],...trendRows(ships.series)
  ],()=>metrics([['今日服务船舶',panels.ships.rows[0][1],'艘'],['本年服务船舶',ships.annual,'艘'],['当日在港',panels.ships.rows[2][1],'艘']])+note(`本年 ${fmt(ships.voyages)} 航次 · 平均在港 ${ships.series['平均在港时长'].values.at(-1)} h`)+tabs('shipService',Object.keys(ships.series))+trend({[choices.shipService||'总航次']:ships.series[choices.shipService||'总航次']})+links([['船舶定位与状态','berths']])),
  taskOverview:card('生产作业','production','场地',[
   ['本月任务数',productionTasks.total,'单'],['本月接单数',productionTasks.accepted,'单'],['本月已完成',productionTasks.completed,'单'],...productionTasks.categories.map(([name,n])=>[name+'作业',n,'单'])
  ],()=>metrics([['本月任务数',productionTasks.total,'单'],['本月接单数',productionTasks.accepted,'单'],['本月已完成',productionTasks.completed,'单']])+heading('本月作业分类','单位：单')+bars(productionTasks.categories)+links([['装卸','cargo'],['加油','fuel'],['输灰','ash']])),
  highRisk:card('今日高风险作业','production','场地',[
   ...panels.safety.rows,...areas.map(([name,n])=>['本周'+name,n,'张'])
  ],()=>metrics(panels.safety.rows.slice(0,3))+heading('今日作业票分类','单位：张')+bars(tickets.filter(([name])=>['动火','高处','吊装'].includes(name)).map(([name,n])=>[name,n,' 张']))+heading('本周高风险作业票分布',`合计 ${sum(areas)} 张`)+`<div class="business-grid">${areas.map(([name,n])=>`<div><span>${name}</span><strong>${n}<small> 张</small></strong></div>`).join('')}</div>`+links([['作业票明细','permits']])),
  stockyard:card('堆场情况','production','场地',[
   ['总面积',yard.total,'m²'],['已租面积',yard.rented,'m²'],['出租率',yard.rate,'%'],...yard.types,...yard.tenants
  ],()=>metrics([['总面积',yard.total/10000,'万m²'],['已租面积',yard.rented/10000,'万m²'],['出租率',yard.rate,'%']])+`<div class="business-progress" role="img" aria-label="出租率 ${yard.rate}%"><span style="width:${yard.rate}%"></span></div>`+heading('场地面积构成','各类型占总面积')+bars(yard.types.map(([name,n])=>[name,percent(n,yard.total),'%']),100)+note('承租单位面积及占比见详情')),
  chemicals:card('危化品储存态势','production','场地',trendRows(chemical.series,monthLabels),()=>metrics(Object.entries(chemical.series).map(([name,s])=>[name,s.values.at(-1),s.unit]))+tabs('chemicals',['月平均库存','周转率','高危周转率'])+trend({[choices.chemicals==='高危周转率'?'高危化学品周转率':choices.chemicals||'月平均库存']:chemical.series[choices.chemicals==='高危周转率'?'高危化学品周转率':choices.chemicals||'月平均库存']},monthLabels)),
  personnel:card('人员管理','safety','人员',[
   ...panels.people.rows,...panels.peopleAffiliation.rows,...panels.peopleEntry.rows,...days.flatMap((day,i)=>Object.entries(personSeries).map(([name,values])=>[day+' · '+name,values[i],'人']))
  ],()=>metrics([['当前在场',386,'人'],['今日峰值',428,'人'],['今日入场',todayEntry,'人']])+heading('当前在场归属','合计 386 人')+bars([['海油内',248,' 人'],['海油外',138,' 人']],386)+tabs('personnel',Object.keys(personSeries))+trend({[choices.personnel||'管理人员']:{values:personSeries[choices.personnel||'管理人员'],unit:'人'}})+note('近七日每日入场人数 · 按人员分类查看')),
  vehicleManagement:card('车辆管理','safety','拖车',[
   ...panels.vehicles.rows,...vehicleTypes.map(([name,n])=>[name,n,'辆'])
  ],()=>metrics([['当前在场',vehicleHistory.at(-1),'辆'],['今日进场',vehicleTraffic[0][1],'车次'],['今日出场',vehicleTraffic[1][1],'车次']])+heading('当前在场车辆类型','单位：辆')+bars(vehicleTypes)+note(`出门审批：待审 ${vehicleApprovalTotals[0][1]} 单 · 已通过 ${vehicleApprovalTotals[1][1]} 单`)+links([['审批明细','approvals'],['车辆定位','vehicleObjects']])),
  hazardManagement:card('隐患管理','safety','场地',[
   ...hidden.severity,...hidden.states,['超期未整改（待整改子集）',hidden.overdue,'项']
  ],()=>metrics(hidden.severity)+heading('隐患处理进度',`合计 ${sum(hidden.severity)} 项`)+bars(hidden.states.map(([name,n])=>[name,n,' 项']),sum(hidden.severity))+`<div class="business-alert"><span>超期未整改</span><strong>${hidden.overdue}<small> 项</small></strong><small>包含在待整改中</small></div>`+links([['重点事项定位','risks']])),
  equipmentUsage:card('设备使用情况','safety','场地',[
   ['今日出勤台数',equipmentTotals.attendance,'台'],['平均使用工时',equipmentTotals.hours,'h'],['平均利用率',equipmentTotals.utilization,'%'],['今日出勤率',equipmentTotals.rate,'%'],...equipment.map(e=>[e.name,e.attendance+' / '+e.total+' 台',e.hours+' h · '+e.utilization+'%'])
  ],()=>metrics([['今日出勤',equipmentTotals.attendance,'台'],['平均使用工时',equipmentTotals.hours,'h'],['平均利用率',equipmentTotals.utilization,'%']])+note(`今日出勤率 ${equipmentTotals.rate}% · ${equipmentTotals.attendance} / ${equipmentTotals.total} 台`)+table(['设备','出勤/总数','工时','利用率'],equipment.map(e=>[e.name,e.attendance+'/'+e.total,e.hours+' h',e.utilization+'%']))+note('利用率按 8 小时计划工时计算，平均值按出勤台数加权')+links([['设备完好与可用情况','availability'],['设备明细','equipment']])),
  energyMonitoring:card('能耗监测','resources','场地',[
   ...panels.electricity.rows,...panels.solar.rows.filter(([name])=>name==='总发电量'),...panels.shore.rows.slice(0,1),...panels.resources.rows,...panels.carbon.rows
  ],()=>metrics([panels.electricity.rows[0],panels.solar.rows[0],panels.electricity.rows[1]])+heading('今日电力使用','单位：kWh')+bars([['光伏自用',10760,''],['岸电使用',8640,'']],42860)+`<div class="business-grid">${panels.resources.rows.map(([label,n,unit])=>`<div><span>${label}</span><strong>${fmt(n)}<small> ${unit}</small></strong></div>`).join('')}<div><span>今日碳减排</span><strong>7.82<small> tCO₂</small></strong></div></div>`+note('岸电属于总用电；光伏发电与自用分别统计')+links([['用电趋势','energyTrend'],['光伏发电','solar'],['岸电','shore'],['碳减排','carbon']])),
  intelligentDevices:card('智能设备','resources','摄像头',[
   ['设备总数（不含定位卡）',sum(devices.types.slice(0,3)),'台'],...devices.types,['今日巡检总数',inspection.total,'次'],['正常巡检',inspection.normal,'次'],['异常巡检',inspection.abnormal,'次'],...trendRows(inspectionSeries)
  ],()=>metrics([['设备总数',sum(devices.types.slice(0,3)),'台'],['定位卡',devices.types[3][1],'张']])+note('设备总数含摄像头、无人机、车载设备；定位卡单列')+`<div class="business-inline">${devices.types.slice(0,3).map(([name,n])=>`<span>${name} <b>${n}</b> 台</span>`).join('')}</div>`+heading('今日智能巡检','单位：次')+metrics([['巡检总数',inspection.total,'次'],['正常',inspection.normal,'次'],['异常',inspection.abnormal,'次']])+trend(inspectionSeries)+`<div class="business-links">${cameras.map((name,i)=>`<button class="text-btn" data-camera="${i}">${esc(name)} ↗</button>`).join('')}</div>`),
  alertEvents:card('告警事件','resources','摄像头',events.map(([type,name,time])=>[type,name,time]),()=>heading('近期告警',`${events.length} 条示例记录`)+linkedRows(events.map(([type,name,time,id])=>[name,type+' · '+time,'data-locate',id]))+note('点击事件定位关联示意对象'),{headers:['告警类型','事件名称','发生时间']}),
  aiRecognition:card('AI 识别','resources','摄像头',[
   ['今日识别总次数',ai.total,'次'],['今日异常事件',ai.abnormal,'次'],['在线算法',ai.algorithms,'个'],['接入通道',ai.channels,'路'],...ai.categories,...ai.exceptions.map(([name,n])=>[name+'异常',n,'次'])
  ],()=>metrics([['今日识别',ai.total,'次'],['异常事件',ai.abnormal,'次']])+`<div class="business-inline"><span>在线算法 <b>${ai.algorithms}</b> 个</span><span>接入通道 <b>${ai.channels}</b> 路</span></div>`+heading('今日识别分类','单位：次')+bars(ai.categories)+note('分类次数合计为识别总次数；异常事件为其中子集'))
 };
 newPanels.stockyard.rows.push(...yard.types.map(([name,n])=>[name+'面积占比',percent(n,yard.total),'%']),...yard.tenants.map(([name,n])=>[name+'已租面积占比',percent(n,yard.rented),'%']));
 return {panels:newPanels,setChoice(key,value){choices[key]=value;},summary:{production:[['本年吞吐量',throughput.year,'万吨','','chart','throughput'],['今日服务船舶',26,'艘','','ship','shipService'],['本月任务',productionTasks.total,'单','','chart','taskOverview'],['今日作业票',sum(tickets),'张','','shield','highRisk']],safety:[['当前在场',386,'人','','gate','personnel'],['在场车辆',vehicleHistory.at(-1),'辆','','truck','vehicleManagement'],['待整改',hidden.states[0][1],'项','','shield','hazardManagement'],['超期未整改',hidden.overdue,'项','','shield','hazardManagement']],resources:[['今日用电',42860,'kWh','','bolt','energyMonitoring'],['智能设备',sum(devices.types.slice(0,3)),'台','','camera','intelligentDevices'],['巡检异常',inspection.abnormal,'次','','shield','intelligentDevices'],['AI异常',ai.abnormal,'次','','shield','aiRecognition']]}};
};
