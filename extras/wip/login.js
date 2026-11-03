/*!
 * luci-theme-oasisic — Login page
 * v1.0.0
 * Handles Bing wallpaper loading
 */

var OasisicLogin = (function() {
  'use strict';

  var WALLPAPER_INTERVAL = 6 * 60 * 60 * 1000;
  var FALLBACK_BG = 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)';

  function init() {
    loadWallpaper();
  }

  function loadWallpaper() {
    var bgEl = document.getElementById('loginBg');
    if (!bgEl) return;
    var cachedUrl = localStorage.getItem('oasisic-wallpaper-url');
    var cachedTime = localStorage.getItem('oasisic-wallpaper-time');
    var now = Date.now();
    if (cachedUrl && cachedTime && (now - parseInt(cachedTime) < WALLPAPER_INTERVAL)) {
      setBackground(bgEl, cachedUrl);
      return;
    }
    fetchBingWallpaper(bgEl);
  }

  function fetchBingWallpaper(bgEl) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/cgi-bin/luci/admin/oasisic/wallpaper', true);
    xhr.timeout = 5000;
    xhr.onload = function() {
      if (xhr.status === 200) {
        try {
          var data = JSON.parse(xhr.responseText);
          if (data && data.success && data.url) {
            setBackground(bgEl, data.url, data.copyright || '');
            localStorage.setItem('oasisic-wallpaper-url', data.url);
            localStorage.setItem('oasisic-wallpaper-time', String(Date.now()));
            return;
          }
        } catch (e) { /* fall */ }
      }
      fallbackBackground(bgEl);
    };
    xhr.onerror = function() { fallbackBackground(bgEl); };
    xhr.ontimeout = function() { fallbackBackground(bgEl); };
    xhr.send();
  }

  function setBackground(el, url, copyright) {
    var img = new Image();
    img.onload = function() { el.style.backgroundImage = 'url(' + url + ')'; };
    img.onerror = function() { fallbackBackground(el); };
    img.src = url;
    if (copyright) {
      var credit = document.getElementById('wallpaperCredit');
      if (credit) credit.textContent = copyright;
    }
  }

  function fallbackBackground(el) {
    el.style.backgroundImage = FALLBACK_BG;
  }

  return {
    init: init,
  };
})();