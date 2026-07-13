/*!
 * luci-theme-oasisic — Dashboard
 * v1.0.0
 * Nikki real-time status polling + auto-refresh
 */

var OasisicDashboard = (function() {
  'use strict';

  var refreshInterval = 10000;
  var timer = null;
  var nikkiTimer = null;
  var nikkiRefreshInterval = 5000; // Nikki 轮询间隔 5s

  var config = {
    showCPU: true,
    showMemory: true,
    showStorage: true,
    showNikki: true,
    showTraffic: true,
  };

  function init() {
    loadConfig();
    bindRefreshControl();
    startAutoRefresh();
    startNikkiPolling();
  }

  function loadConfig() {
    // Read config from data attributes set by server
    var html = document.documentElement;
    config.showCPU = html.getAttribute('data-show-cpu') !== '0';
    config.showMemory = html.getAttribute('data-show-mem') !== '0';
    config.showStorage = html.getAttribute('data-show-storage') !== '0';
    config.showNikki = html.getAttribute('data-show-nikki') !== '0';
    config.showTraffic = html.getAttribute('data-show-traffic') !== '0';

    var refresh = parseInt(html.getAttribute('data-refresh')) || 10;
    if (refresh > 0) {
      refreshInterval = refresh * 1000;
    }
  }

  function bindRefreshControl() {
    var refreshBtn = document.querySelector('.oasisic-dashboard-refresh');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', function() {
        refreshData();
      });
    }
  }

  function startAutoRefresh() {
    if (timer) clearInterval(timer);
    if (refreshInterval > 0) {
      timer = setInterval(refreshData, refreshInterval);
    }
  }

  // ===== Nikki 实时轮询 =====

  function startNikkiPolling() {
    if (!config.showNikki) return;
    if (nikkiTimer) clearInterval(nikkiTimer);
    // 立即请求一次
    pollNikkiStatus();
    nikkiTimer = setInterval(pollNikkiStatus, nikkiRefreshInterval);
  }

  function pollNikkiStatus() {
    // 通过 LuCI JSON-RPC 获取 Nikki 状态
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/cgi-bin/luci/admin/services/nikki/status?format=json', true);
    xhr.timeout = 3000;

    xhr.onload = function() {
      if (xhr.status === 200) {
        try {
          var data = JSON.parse(xhr.responseText);
          updateNikkiWidget(data);
        } catch (e) { /* ignore parse errors */ }
      }
    };
    xhr.send();
  }

  function updateNikkiWidget(data) {
    var card = document.querySelector('.oasisic-card-nikki');
    if (!card) return;

    // 更新代理模式
    var modeEl = card.querySelector('[data-nikki="mode"]');
    if (modeEl && data.mode) {
      modeEl.textContent = data.mode;
    }

    // 更新节点延迟
    var nodeEl = card.querySelector('[data-nikki="node"]');
    if (nodeEl && data.node) {
      var latency = parseInt(data.delay) || 0;
      var color = latency < 100 ? 'green' : (latency < 300 ? 'orange' : 'red');
      nodeEl.innerHTML = '<span class="oasisic-info-value ' + color + '">' +
        data.flag + ' ' + data.node + ' · ' + data.delay + 'ms</span>';
    }

    // 更新流量
    var txEl = card.querySelector('[data-nikki="tx"]');
    var rxEl = card.querySelector('[data-nikki="rx"]');
    if (txEl && data.tx) txEl.textContent = data.tx;
    if (rxEl && data.rx) rxEl.textContent = data.rx;

    // 更新状态色
    var badge = card.querySelector('.oasisic-card-badge');
    if (badge && data.running !== undefined) {
      badge.textContent = data.running ? '运行中' : '已停止';
      badge.className = 'oasisic-card-badge ' + (data.running ? 'blue' : '');
    }
  }

  // ===== 通用刷新 =====

  function refreshData() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', window.location.href + '&format=json', true);
    xhr.timeout = 5000;
    xhr.onload = function() {
      if (xhr.status === 200) {
        try {
          var data = JSON.parse(xhr.responseText);
          updateSystemStats(data);
        } catch (e) { /* ignore */ }
      }
    };
    xhr.send();
  }

  function updateSystemStats(data) {
    if (data.load) {
      var loadEl = document.querySelector('[data-stat="load"]');
      if (loadEl) loadEl.textContent = data.load;
    }
    if (data.uptime) {
      var uptimeEl = document.querySelector('[data-stat="uptime"]');
      if (uptimeEl) uptimeEl.textContent = data.uptime;
    }
    if (data.mem !== undefined) {
      var memEl = document.querySelector('[data-stat="mem"]');
      if (memEl) memEl.textContent = data.mem + '%';
    }
    if (data.cpu !== undefined) {
      var cpuEl = document.querySelector('[data-stat="cpu"]');
      if (cpuEl) cpuEl.textContent = data.cpu + '%';
    }
  }

  function updateAutoRefreshInterval(ms) {
    refreshInterval = ms;
    if (timer) {
      clearInterval(timer);
      startAutoRefresh();
    }
  }

  return {
    init: init,
    updateAutoRefreshInterval: updateAutoRefreshInterval,
    pollNikkiStatus: pollNikkiStatus,
  };
})();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() { OasisicDashboard.init(); });
} else {
  OasisicDashboard.init();
}