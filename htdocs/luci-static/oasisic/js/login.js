/*!
 * luci-theme-oasisic — Login page
 * v1.0.0
 */

var OasisicLogin = (function() {
  'use strict';

  var WALLPAPER_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours in ms
  var BING_API = 'https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=zh-CN';
  var FALLBACK_BG = 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)';

  function init() {
    loadWallpaper();
    bindFormShake();
  }

  function loadWallpaper() {
    var bgEl = document.getElementById('loginBg');
    if (!bgEl) return;

    var cachedUrl = localStorage.getItem('oasisic-wallpaper-url');
    var cachedTime = localStorage.getItem('oasisic-wallpaper-time');
    var now = Date.now();

    // Use cached wallpaper if still fresh
    if (cachedUrl && cachedTime && (now - parseInt(cachedTime) < WALLPAPER_INTERVAL)) {
      setBackground(bgEl, cachedUrl);
      return;
    }

    // Fetch new wallpaper from Bing
    fetchBingWallpaper(bgEl);
  }

  function fetchBingWallpaper(bgEl) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', BING_API, true);
    xhr.timeout = 5000;

    xhr.onload = function() {
      if (xhr.status === 200) {
        try {
          var data = JSON.parse(xhr.responseText);
          if (data && data.images && data.images[0] && data.images[0].url) {
            var url = 'https://www.bing.com' + data.images[0].url;
            setBackground(bgEl, url);
            localStorage.setItem('oasisic-wallpaper-url', url);
            localStorage.setItem('oasisic-wallpaper-time', String(Date.now()));
            return;
          }
        } catch (e) { /* fall through */ }
      }
      fallbackBackground(bgEl);
    };

    xhr.onerror = function() { fallbackBackground(bgEl); };
    xhr.ontimeout = function() { fallbackBackground(bgEl); };

    xhr.send();
  }

  function setBackground(el, url) {
    // Preload then set
    var img = new Image();
    img.onload = function() {
      el.style.backgroundImage = 'url(' + url + ')';
    };
    img.onerror = function() { fallbackBackground(el); };
    img.src = url;
  }

  function fallbackBackground(el) {
    el.style.backgroundImage = FALLBACK_BG;
  }

  function bindFormShake() {
    var form = document.querySelector('.oasisic-login-form');
    if (!form) return;

    form.addEventListener('submit', function(e) {
      var username = document.getElementById('username');
      var password = document.getElementById('password');
      if (!username.value || !password.value) {
        e.preventDefault();
        var card = document.querySelector('.oasisic-login-card');
        if (card) {
          card.classList.remove('shake');
          // Force reflow
          void card.offsetWidth;
          card.classList.add('shake');
          setTimeout(function() { card.classList.remove('shake'); }, 500);
        }
      }
    });
  }

  function passkeyAuth() {
    // WebAuthn integration — placeholder for future implementation
    if (window.PublicKeyCredential) {
      Oasisic.showToast('Passkey authentication not yet configured', 'info');
    } else {
      Oasisic.showToast('Passkey not supported on this device', 'error');
    }
  }

  function show2FA() {
    Oasisic.showToast('2FA TOTP input not yet implemented', 'info');
  }

  return {
    init: init,
    passkeyAuth: passkeyAuth,
    show2FA: show2FA,
  };
})();