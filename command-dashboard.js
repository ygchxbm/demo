/* V3 综合大屏：复用 V2 数据与交互，独立组织同屏业务模块。 */
window.createPortDashboard = function (api) {
  'use strict';
  const { panels, days, personSeries, productionTasks, productionSeries, tickets,
    safetyEquipment, points, cameras, cameraPositions, icon, esc, fmt } = api;
  const $ = selector => document.querySelector(selector);
  const rowValue = (key, name) => panels[key].rows.find(row => row[0] === name)?.[1];
  const color = index => `var(--cc-series-${index % 4})`;
  const sum = values => values.reduce((total, value) => total + value, 0);
  let serial = 0;

  /* 新模块仅使用用户提供的 Axure 原型数值，不补造历史或实时告警。 */
  const yard = { total: 424267, rented: 310245, categories: [['库房', 27, 83294], ['堆场', 37, 83294], ['车间', 56, 183294]] };
  const storage = [['月平均库存量', 362, 't'], ['周转率', 53.2, '%'], ['高危化学品周转率', 93, '%'], ['容量', 12458, 't'], ['周转量', 800, 't']];
  const hazards = [['重大隐患', 11, '项'], ['一般隐患', 148, '项'], ['整改完成率', 36, '%'], ['待整改', 0, '项'], ['待验收', 4, '项'], ['超期未整改', 39, '项'], ['已验收', 127, '项']];
  const recognition = [['总设备数', 115, '台'], ['摄像头', 85, '台'], ['无人机', 12, '台'], ['车载', 3, '台'], ['定位卡', 15, '张'], ['AI 识别次数', 4716, '次'], ['异常事件', 85, '次'], ['在岗人数', 25, '人'], ['入场车辆', 48, '辆']];
  const energyRows = [panels.electricity.rows[0], panels.solar.rows[0], panels.electricity.rows[1], panels.electricity.rows[2], panels.shore.rows[0], ...panels.resources.rows, panels.carbon.rows[0]];
  const deviceKinds = ['叉车', '拖车', '平板拖车', '汽车吊', '轮胎吊'];
  const deviceRows = deviceKinds.map(kind => {
    const samples = points.filter(point => point.kind === kind);
    return [kind, samples.length, samples.filter(point => point.status !== '空闲').length];
  });
  const allRows = keys => keys.flatMap(key => panels[key].rows.map(row => [...row]));
  function register(key, title, rows, headers, note, topic = 'people') {
    panels[key] = { title, rows, headers, note, topic, kind: '场地' };
  }
  register('ccPeople', '人员动态', allRows(['people', 'peopleAffiliation', 'peopleEntry']), undefined, '当前在场与累计入场分别统计；下方数值与主屏共用 V2 演示数据。');
  register('ccProduction', '生产状态', [...allRows(['production', 'shipWork', 'fuel', 'cargo', 'ash']), ...Object.entries(productionSeries).flatMap(([name, values]) => [[name + ' · ' + days.at(-1), values.at(-1), 't'], [name + ' · ' + days.at(-2), values.at(-2), 't']])], undefined, '作业完成率由已完成 / 任务总数计算；各业务数量的单位与周期独立。', 'production');
  register('ccEnergy', '能耗监测', energyRows.map(row => [...row]), undefined, '沿用 V2 今日演示数据；未提供的同比、环比不补造。碳减排月、年值可在下表查看。', 'energy');
  panels.ccEnergy.rows.push(...panels.carbon.rows.slice(1));
  register('ccYard', '堆场管理情况', [['总量', yard.total, 'm³'], ['已租量', yard.rented, 'm³'], ['出租率', Number((yard.rented / yard.total * 100).toFixed(1)), '%'], ...yard.categories.flatMap(([name, rate, amount]) => [[name + '参考比例', rate, '%'], [name + '参考量', amount, 'm³']])], undefined, '用户提供的 Axure 原型补充数据。原型使用 m³ 容量口径；各分类比例为独立参考指标，不作合计。');
  register('ccStorage', '油品仓储态势', storage, undefined, '用户提供的 Axure 原型演示指标；未提供库存历史，不生成虚构趋势。');
  register('ccHazards', '隐患治理统计', hazards, undefined, '沿用 Axure 原型独立指标口径；36% 为原型给定指标，未提供其分母，不能用已验收数量反推。', 'safety');
  register('ccRecognition', '智能识别设备', recognition, undefined, 'Axure 原型演示汇总；异常次数不是当前实时告警记录，未接入识别服务。', 'safety');
  register('ccDevices', '作业设备状态', deviceRows, ['设备类型', '地图示意数量', '作业中示意数量'], '仅统计当前地图的示意点位，不代表全部设备台账或真实利用率。', 'production');
  register('ccSafety', '安全控制', [...panels.safety.rows, ...panels.availability.rows, ...safetyEquipment.flatMap(item => [['设备总数 · ' + item.name, item.total, '台'], ['可用 · ' + item.name, item.available, '台'], ['停用 · ' + item.name, item.stopped, '台'], ['在用 · ' + item.name, item.inUse, '台'], ['完好率 · ' + item.name, item.integrity, '%']])], undefined, '沿用 V2 作业票与设备数据；在用属于可用的子集，不重复累加。', 'safety');
  register('ccAlerts', '告警关注事项', panels.risks.rows, panels.risks.headers, '未接入实时告警，以下仅为 V2 已有的三条关注事项，不补造事件时间。', 'safety');

  function stats(rows, extra = '') {
    return `<div class="cc-stats ${extra}" style="--cc-stat-count:${rows.length}">${rows.map(([label, value, unit = '']) => `<div><span>${esc(label)}</span><strong>${esc(fmt(value))}<small>${esc(unit)}</small></strong></div>`).join('')}</div>`;
  }
  function subtitle(title, unit = '') {
    return `<div class="cc-subtitle"><h3>${esc(title)}</h3><span>${esc(unit)}</span></div>`;
  }
  function dataTable(headers, rows, extra = '') {
    return `<table class="cc-table ${extra}"><thead><tr>${headers.map(label => `<th scope="col">${esc(label)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(value => `<td>${esc(fmt(value))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  }
  function bars(rows, unit = '', maximum = Math.max(...rows.map(row => row[1]))) {
    return `<div class="cc-bars">${rows.map(([name, value], index) => `<div style="--cc-color:${color(index)}"><span>${esc(name)}</span><meter min="0" max="${maximum || 1}" value="${value}" aria-label="${esc(name)} ${value}${esc(unit)}"></meter><b>${fmt(value)}<small>${esc(unit)}</small></b></div>`).join('')}</div>`;
  }

  /* 单位相同的序列共用零起点；多业务单位不同，使用独立小图。 */
  function chart(series, { labels = days, type = 'line', unit = '', legend = true, palette = 0 } = {}) {
    const id = 'cc-chart-' + ++serial;
    const top = 14, bottom = 142, left = 43, right = 476;
    const maxValue = Math.max(1, ...series.flatMap(item => item.values));
    const magnitude = 10 ** Math.floor(Math.log10(maxValue));
    const maximum = Math.ceil(maxValue / magnitude * 1.12) * magnitude;
    const x = index => left + (index + .5) * (right - left) / labels.length;
    const y = value => bottom - value / maximum * (bottom - top);
    const grid = [0, .5, 1].map(fraction => `<line x1="${left}" x2="${right}" y1="${y(maximum * fraction)}" y2="${y(maximum * fraction)}" class="cc-gridline"/><text x="${left - 9}" y="${y(maximum * fraction) + 5}" text-anchor="end">${fmt(maximum * fraction)}</text>`).join('');
    const shapes = series.map((item, index) => {
      const stroke = color(index + palette);
      const fillId = id + '-fill-' + index;
      const definition = `<defs><linearGradient id="${fillId}" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${stroke}"/><stop offset="1" stop-color="${stroke}" stop-opacity=".12"/></linearGradient></defs>`;
      if (type === 'bar') {
        const width = Math.min(24, (right - left) / labels.length / (series.length + 1));
        return definition + item.values.map((value, position) => {
          const px = x(position) + (index - (series.length - 1) / 2) * (width + 3) - width / 2;
          const py = y(value), height = bottom - py;
          const barColor = position === item.values.length - 1 ? color(index + palette + 1) : stroke;
          const barFill = fillId + '-' + position;
          return `<defs><linearGradient id="${barFill}" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${barColor}"/><stop offset="1" stop-color="${barColor}" stop-opacity=".3"/></linearGradient></defs><g class="cc-column" style="--cc-color:${barColor}" tabindex="0" data-tip="${esc(labels[position] + ' · ' + item.name + '：' + fmt(value) + ' ' + unit)}"><title>${esc(item.name)} ${fmt(value)} ${esc(unit)}</title><rect x="${px}" y="${py}" width="${width}" height="${height}" rx="2" fill="${stroke}" class="cc-column-flat"/><rect x="${px}" y="${py}" width="${width}" height="${height}" rx="1" fill="url(#${barFill})" class="cc-column-solid"/><path class="cc-bar-depth" d="M${px + width} ${py}l5 -4v${height}l-5 4z" fill="${barColor}"/><path class="cc-bar-depth cc-bar-top" d="M${px} ${py}l5 -4h${width}l-5 4z" fill="${barColor}"/></g>`;
        }).join('');
      }
      const path = item.values.map((value, position) => `${position ? 'L' : 'M'}${x(position)} ${y(value)}`).join(' ');
      return `${definition}<path class="cc-area-fill" d="${path} L${x(item.values.length - 1)} ${bottom} L${x(0)} ${bottom} Z" fill="url(#${fillId})"/><path class="cc-line-depth" d="${path}" stroke="${stroke}"/><path d="${path}" fill="none" stroke="${stroke}" stroke-width="2.5"/>${item.values.map((value, position) => `<g tabindex="0" data-tip="${esc(labels[position] + ' · ' + item.name + '：' + fmt(value) + ' ' + unit)}"><circle cx="${x(position)}" cy="${y(value)}" r="9" fill="transparent"/><circle cx="${x(position)}" cy="${y(value)}" r="3" fill="${stroke}"/></g>`).join('')}`;
    }).join('');
    return `<div class="cc-chart-wrap">${legend ? `<div class="cc-chart-legend">${series.map((item, index) => `<span style="--cc-color:${color(index + palette)}"><i></i>${esc(item.name)}</span>`).join('')}</div>` : ''}<svg class="cc-chart" preserveAspectRatio="none" viewBox="0 0 490 178" role="img" aria-labelledby="${id}"><title id="${id}">${esc(series.map(item => item.name + '：' + item.values.map((value, index) => labels[index] + ' ' + value + unit).join('，')).join('；'))}</title>${grid}${shapes}${labels.map((label, index) => `<text x="${x(index)}" y="168" text-anchor="middle">${esc(label)}</text>`).join('')}</svg></div>`;
  }
  function gauge(value, label, index = 0) {
    const radius = 49, length = Math.PI * radius;
    return `<div class="cc-gauge" tabindex="0" data-tip="${esc(label)}：${value}%" style="--cc-color:${color(index)}"><svg viewBox="0 0 140 93" role="img" aria-label="${esc(label)} ${value}%"><path class="cc-gauge-shadow" d="M21 65 A49 49 0 0 1 119 65"/><path class="cc-gauge-track" d="M21 65 A49 49 0 0 1 119 65"/><path class="cc-gauge-value" d="M21 65 A49 49 0 0 1 119 65" stroke-dasharray="${length * value / 100} ${length}"/><path class="cc-gauge-edge" d="M13 65 A57 57 0 0 1 127 65"/><text x="70" y="60" text-anchor="middle">${value}<tspan>%</tspan></text><text class="cc-gauge-label" x="70" y="86" text-anchor="middle">${esc(label)}</text></svg></div>`;
  }
  function proportion(value, label, index = 0) {
    return `<div class="cc-proportion" style="--cc-color:${color(index)}"><span>${esc(label)}</span><meter min="0" max="100" value="${value}" aria-label="${esc(label)} ${value}%"></meter><b>${value}<small>%</small></b></div>`;
  }
  function card(key, title, glyph, content, extra = '', note = '') {
    return `<section class="cc-card ${extra}" data-panel="${key}" aria-label="${esc(title)}"><header class="cc-card-head"><h2>${icon(glyph)}${esc(title)}</h2><button data-detail="${key}" aria-label="查看${esc(title)}详情">详情 ${icon('arrow')}</button></header><div class="cc-card-body">${content}</div>${note ? `<p class="cc-card-note">${esc(note)}</p>` : ''}</section>`;
  }
  function personnel() {
    const rows = panels.people.rows;
    return card('ccPeople', '人员动态', 'people', stats([rows[0], rows[1], panels.peopleEntry.rows[0]]) + `<div class="cc-affiliation">${panels.peopleAffiliation.rows.slice(0, 2).map(([name, value]) => `<span>${esc(name)} <b>${fmt(value)}</b> 人</span>`).join('')}</div>` + subtitle('近七日人员入场趋势', '人次') + chart(Object.entries(personSeries).map(([name, values]) => ({ name, values })), { unit: '人次' }), 'cc-personnel');
  }
  function vehicles() {
    return card('vehicles', '车辆动态', 'truck', stats(panels.vehicles.rows.slice(0, 3)) + `<div class="cc-inline-metrics"><span>进出合计 <b>${fmt(api.vehicleTrafficTotal())}</b> 车次</span><button data-detail="approvals">出门审批 <b>${sum(api.vehicleApprovalTotals.map(row => row[1]))}</b> 单 · 待审 ${api.vehicleApprovalTotals[0][1]}</button></div>` + subtitle('近七日在场车辆', '辆') + chart([{ name: '在场车辆', values: api.vehicleHistory }], { type: 'bar', unit: '辆', legend: false }), 'cc-vehicles');
  }
  function production() {
    const complete = Number((productionTasks.completed / productionTasks.total * 100).toFixed(1));
    const groups = [['生产作业', [['完成率', complete, '%'], ['任务数', productionTasks.total, '单'], ['接单数', productionTasks.accepted, '单']]], ['船舶作业', panels.shipWork.rows], ['加油作业', panels.fuel.rows], ['卸装作业', panels.cargo.rows.slice(0, 3)], ['输灰作业', panels.ash.rows]];
    return card('ccProduction', '生产状态', 'chart', `<div class="cc-production-grid">${groups.map(([name, rows], index) => `<section>${subtitle(name)}${stats(rows, 'cc-stats-compact')}${index === 0 ? bars(productionTasks.categories.map(([label, value]) => [label, value]), '单') : ''}</section>`).join('')}</div><div class="cc-production-trends">${Object.entries(productionSeries).map(([name, values]) => `<section>${subtitle(name + '趋势', 't')}${chart([{ name, values }], { legend: false, unit: 't', palette: Object.keys(productionSeries).indexOf(name) })}</section>`).join('')}</div>`, 'cc-production');
  }
  function ships() {
    return card('ships', '船舶动态', 'ship', stats(panels.ships.rows) + subtitle('近七日航次', '航次') + chart([{ name: '每日航次', values: api.shipVoyageValues }], { type: 'bar', unit: '航次', legend: false, palette: 1 }) + `<div class="cc-map-links">${points.filter(point => point.kind === '船舶').map(point => `<button data-locate="${point.id}" aria-label="定位${esc(point.name)}">${esc(point.name.replace('示意船舶 ', ''))}<span>${esc(point.status)}</span></button>`).join('')}</div>`, 'cc-ships');
  }
  function devices() {
    return card('ccDevices', '作业设备状态', 'crane', `<div class="cc-device-rows">${deviceRows.map(([kind, total, active], index) => `<button style="--cc-color:${color(index)}" data-locate="${points.find(point => point.kind === kind).id}">${icon(api.layerKinds[kind])}<span>${esc(kind)}</span><b>${active} / ${total}</b><meter min="0" max="${total}" value="${active}" aria-label="${esc(kind)}示意点位中作业 ${active} 个，共 ${total} 个"></meter></button>`).join('')}</div>`, 'cc-devices', '作业 / 地图示意数量，非全量设备利用率');
  }
  function energy() {
    return card('ccEnergy', '能耗监测', 'bolt', dataTable(['能源项目', '今日', '单位'], energyRows.map(([name, value, unit]) => [name.replace('今日', ''), value, unit])) + subtitle('近七日用电量', 'kWh') + chart([{ name: '总用电量', values: panels.energyTrend.rows.map(row => row[1]) }], { type: 'bar', legend: false, unit: 'kWh', palette: 2 }) + `<div class="cc-inline-metrics"><span>本月减排 <b>${fmt(rowValue('carbon', '本月碳减排'))}</b> tCO₂</span><span>本年 <b>${fmt(rowValue('carbon', '本年碳减排'))}</b> tCO₂</span></div>`, 'cc-energy');
  }
  function yardCard() {
    return card('ccYard', '堆场管理情况', 'area', stats(panels.ccYard.rows.slice(0, 3), 'cc-stats-compact') + `<div class="cc-dimensional-only cc-yard-visual">${proportion(Number((yard.rented / yard.total * 100).toFixed(1)), '整体出租率')}${yard.categories.map(([name, rate, amount], index) => `<div class="cc-yard-category" tabindex="0" data-tip="${esc(name)}：参考量 ${fmt(amount)} m³，独立参考比例 ${rate}%">${proportion(rate, name, index + 1)}<small>参考量 ${fmt(amount)} m³</small></div>`).join('')}</div>` + dataTable(['分类', '参考量（m³）', '参考比例'], yard.categories.map(([name, rate, amount]) => [name, amount, rate + '%']), 'cc-flat-only'), 'cc-yard', 'Axure 补充演示 · 原型容量口径，各分类独立');
  }
  function storageCard() {
    return card('ccStorage', '油品仓储态势', 'area', `<div class="cc-flat-only">${stats(storage.slice(0, 3), 'cc-stats-compact')}</div><div class="cc-dimensional-only cc-oil-visual">${stats(storage.slice(0, 1), 'cc-stats-minor')}<div class="cc-gauge-pair">${gauge(storage[1][1], storage[1][0])}${gauge(storage[2][1], storage[2][0], 1)}</div></div>` + stats(storage.slice(3), 'cc-stats-minor'), 'cc-storage', 'Axure 补充演示 · 未提供历史，保留数值与比例');
  }
  function safety() {
    return card('ccSafety', '安全控制', 'shield', stats(panels.safety.rows.slice(0, 2)) + subtitle('高风险作业票统计', '张') + bars(tickets, '张') + subtitle('关键重要设备状态', '台') + `<div class="cc-flat-only">${stats(panels.availability.rows.slice(0, 3), 'cc-stats-compact')}</div><div class="cc-dimensional-only cc-safety-visual">${stats(panels.availability.rows.slice(0, 1), 'cc-stats-minor')}<div class="cc-gauge-pair">${gauge(panels.availability.rows[1][1], '年可用率')}${gauge(panels.availability.rows[2][1], '设备完好率', 1)}</div></div>` + dataTable(panels.equipment.headers, panels.equipment.rows), 'cc-safety');
  }
  function hazardCard() {
    return card('ccHazards', '隐患治理统计', 'shield', stats(hazards.slice(0, 3), 'cc-stats-compact') + stats(hazards.slice(3), 'cc-stats-minor'), 'cc-hazards', 'Axure 补充演示 · 完成率沿用原型独立口径');
  }
  function recognitionCard() {
    return card('ccRecognition', '智能识别设备', 'camera', `<div class="cc-recognition-devices">${recognition.slice(0, 5).map(([name, value]) => `<span>${esc(name)}<b>${fmt(value)}</b></span>`).join('')}</div>` + stats(recognition.slice(5), 'cc-stats-minor'), 'cc-recognition', 'Axure 补充演示 · 未接入识别服务');
  }
  function alerts() {
    return card('ccAlerts', '告警关注事项', 'shield', `<div class="cc-alert-list">${panels.risks.rows.map(([name, location, status], index) => `<button ${index < 2 ? `data-locate="${['a3', 'a2'][index]}"` : 'data-detail="risks"'}><i></i><span>${esc(name)}</span><small>${esc(location)}</small><b>${esc(status)}</b></button>`).join('')}</div>`, 'cc-alerts', '3 条关注示例 · 未接入实时告警');
  }
  function renderPanels() {
    $('#left-panels').innerHTML = `<div class="cc-left-top">${personnel()}${vehicles()}</div><div class="cc-left-bottom">${production()}<div class="cc-left-secondary">${ships()}${devices()}</div></div>`;
    $('#right-panels').innerHTML = `<div class="cc-resource-column">${energy()}${yardCard()}${storageCard()}</div><div class="cc-safety-column">${safety()}${hazardCard()}${recognitionCard()}${alerts()}</div>`;
  }
  function renderSummary() {
    const rows = [['年吞吐量', ...panels.shipWork.rows[0].slice(1), 'ship', 'shipWork'], ['当日在港', ...panels.ships.rows[2].slice(1), 'ship', 'ships'], ['作业完成率', Number((productionTasks.completed / productionTasks.total * 100).toFixed(1)), '%', 'chart', 'production'], ['年可用率', panels.availability.rows[1][1], '%', 'shield', 'availability'], ['设备完好率', panels.availability.rows[2][1], '%', 'crane', 'availability'], ['今日用电', energyRows[0][1], 'kWh', 'bolt', 'ccEnergy']];
    $('#summary').innerHTML = rows.map(([name, value, unit, glyph, key]) => `<button class="cc-summary-item" data-detail="${key}" aria-label="查看${name}详情">${icon(glyph)}<span>${esc(name)}<strong>${fmt(value)}<small>${unit}</small></strong></span>`).join('');
  }
  function renderVideo() {
    $('#cc-video-strip').innerHTML = cameras.map((name, index) => `<button class="cc-camera" data-camera="${index}" style="--camera-position:${cameraPositions[index]}" aria-label="放大${esc(name)}模拟画面"><span class="cc-camera-name">${icon('camera')}${esc(name)}</span><span class="cc-camera-state">静态模拟</span><span class="cc-camera-foot">CAM 0${index + 1} · 点击放大</span></button>`).join('');
  }
  function render() {
    document.documentElement.dataset.topic = 'people';
    document.documentElement.dataset.layout = 'business';
    if (!$('#cc-video-strip')) {
      $('.center').prepend($('#summary'));
      const video = document.createElement('section');
      video.id = 'cc-video-strip';
      video.setAttribute('aria-label', '港区模拟视频监控');
      $('.center').append(video);
      $('#map-stage').prepend($('#panorama-layer'));
    }
    renderPanels(); renderSummary(); renderVideo();
    $('#topic-en').textContent = 'INTEGRATED PORT OPERATIONS · V3';
    $('#topic-label').textContent = '全部业务';
    $('#map-title').textContent = '港区运行态势';
    $('#map-note').textContent = '港区全景 · 示意位置';
  }
  return { render, renderPanels, renderSummary };
};
