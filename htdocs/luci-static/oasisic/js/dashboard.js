/*!
 * luci-theme-oasisic — Dashboard
 * v1.0.0
 */

var OasisicDashboard = (function() {
  'use strict';

  var refreshInterval = 10000; // 10 seconds
  var timer = null;

  function init() {
    bindRefreshControl();
    startAutoRefresh();
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
    timer = setInterval(refreshData, refreshInterval);
  }

  function refreshData() {
    // Fetch updated system stats via LuCI JSON-RPC
    var xhr = new XMLHttpRequest();
    xhr.open('GET', window.location.href + '&format=json', true);
    xhr.timeout = 5000;
    xhr.onload = function() {
      if (xhr.status === 200) {
        // Parse and update dashboard widgets
        // (LuCI JSON-RPC integration will be expanded)
      }
    };
    xhr.send();
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
  };
})();

// Auto-init when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() { OasisicDashboard.init(); });
} else {
  OasisicDashboard.init();
}