/*!
 * luci-theme-oasisic — 性能分析面板
 * v1.0.0
 * 实时延迟/吞吐量历史图表，纯 JS 无外部依赖
 */

var OasisicPerf = (function() {
  'use strict';

  var MAX_POINTS = 60; // 保存 60 个数据点
  var POLL_INTERVAL = 10000; // 10s
  var timer = null;

  var data = {
    latency: [],
    throughput: [],
    cpu: [],
    mem: [],
    timestamps: [],
  };

  function init() {
    loadHistory();
    poll();
    timer = setInterval(poll, POLL_INTERVAL);
    bindTabSwitch();
  }

  function loadHistory() {
    try {
      var saved = JSON.parse(localStorage.getItem('oasisic-perf-data'));
      if (saved && saved.latency) {
        data = saved;
      }
    } catch(e) {}
    renderAll();
  }

  function saveHistory() {
    // Trim to max points
    if (data.timestamps.length > MAX_POINTS) {
      var trim = data.timestamps.length - MAX_POINTS;
      data.latency.splice(0, trim);
      data.throughput.splice(0, trim);
      data.cpu.splice(0, trim);
      data.mem.splice(0, trim);
      data.timestamps.splice(0, trim);
    }
    localStorage.setItem('oasisic-perf-data', JSON.stringify(data));
  }

  function poll() {
    var now = Date.now();
    var ts = new Date().toLocaleTimeString();

    // Record current values from dashboard
    var latencyEl = document.querySelector('[data-stat="nikki-latency"]');
    var txEl = document.querySelector('[data-stat="nikki-tx"]');
    var cpuEl = document.querySelector('[data-stat="cpu"]');
    var memEl = document.querySelector('[data-stat="mem"]');

    data.timestamps.push(ts);
    data.latency.push(latencyEl ? parseFloat(latencyEl.textContent) || 0 : 0);
    data.throughput.push(txEl ? parseFloat(txEl.textContent) || 0 : 0);
    data.cpu.push(cpuEl ? parseFloat(cpuEl.textContent) || 0 : 0);
    data.mem.push(memEl ? parseFloat(memEl.textContent) || 0 : 0);

    saveHistory();
    renderAll();
    updateStats();
  }

  // ===== 渲染图表 =====

  function renderAll() {
    renderLineChart('oasisic-chart-latency', data.latency, '#0071e3', 'ms');
    renderLineChart('oasisic-chart-throughput', data.throughput, '#30d158', 'MB/s');
    renderLineChart('oasisic-chart-cpu', data.cpu, '#ff9f0a', '%');
    renderLineChart('oasisic-chart-mem', data.mem, '#5ac8fa', '%');
  }

  function renderLineChart(canvasId, values, color, unit) {
    var canvas = document.getElementById(canvasId);
    if (!canvas || values.length < 2) return;

    var ctx = canvas.getContext('2d');
    var w = canvas.width;
    var h = canvas.height;
    var padding = { top: 8, right: 8, bottom: 20, left: 8 };
    var plotW = w - padding.left - padding.right;
    var plotH = h - padding.top - padding.bottom;

    ctx.clearRect(0, 0, w, h);

    var max = Math.max.apply(null, values) || 1;
    var min = Math.min.apply(null, values) || 0;
    var range = max - min || 1;

    // Grid lines
    ctx.strokeStyle = 'rgba(0,0,0,0.04)';
    ctx.lineWidth = 0.5;
    for (var i = 0; i < 4; i++) {
      var y = padding.top + (plotH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();
    }

    // Data line
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.beginPath();

    for (var i = 0; i < values.length; i++) {
      var x = padding.left + (plotW / (values.length - 1)) * i;
      var y = padding.top + plotH - ((values[i] - min) / range) * plotH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Current value
    var last = values[values.length - 1];
    ctx.fillStyle = color;
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(last.toFixed(1) + ' ' + unit, w - padding.right, padding.top + 12);
  }

  function updateStats() {
    var el = document.getElementById('oasisic-perf-stats');
    if (!el) return;

    var avg = data.latency.reduce(function(a, b) { return a + b; }, 0) / (data.latency.length || 1);
    var max = Math.max.apply(null, data.latency) || 0;
    var min = Math.min.apply(null, data.latency) || 0;

    el.innerHTML =
      '<div class="oasisic-perf-stat"><span class="lbl">平均延迟</span><span class="val">' + avg.toFixed(0) + ' ms</span></div>' +
      '<div class="oasisic-perf-stat"><span class="lbl">最低延迟</span><span class="val green">' + min.toFixed(0) + ' ms</span></div>' +
      '<div class="oasisic-perf-stat"><span class="lbl">最高延迟</span><span class="val orange">' + max.toFixed(0) + ' ms</span></div>' +
      '<div class="oasisic-perf-stat"><span class="lbl">数据点</span><span class="val">' + data.timestamps.length + '</span></div>';
  }

  function bindTabSwitch() {
    var tabs = document.querySelectorAll('.oasisic-perf-tab');
    tabs.forEach(function(tab) {
      tab.addEventListener('click', function() {
        tabs.forEach(function(t) { t.classList.remove('active'); });
        this.classList.add('active');
        var target = this.getAttribute('data-target');
        document.querySelectorAll('.oasisic-perf-panel').forEach(function(p) {
          p.style.display = p.id === target ? 'block' : 'none';
        });
      });
    });
  }

  return {
    init: init,
  };
})();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() { OasisicPerf.init(); });
} else {
  OasisicPerf.init();
}