/*!
 * luci-theme-oasisic — Login page
 * v1.0.0
 * 安全登录流程：密码校验 → TOTP 验证 → 签发 session
 * 密码正确但未通过 TOTP 时不会签发最终 session cookie
 */

var OasisicLogin = (function() {
  'use strict';

  var WALLPAPER_INTERVAL = 6 * 60 * 60 * 1000;
  var BING_API = 'https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=zh-CN';
  var FALLBACK_BG = 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)';
  var pendingTicket = null;
  var config = { totpEnabled: false, totpAvailable: false };

  function init(opts) {
    if (opts) {
      config.totpEnabled = opts.totpEnabled || false;
      config.totpAvailable = opts.totpAvailable || false;
    }
    loadWallpaper();
    bindFormSubmit();
    bindTOTPSubmit();
    bindTOTPInput();
  }

  // ===== Bing 壁纸 =====

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
    xhr.open('GET', OASISIC_API_PATH + '/wallpaper', true);
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

  // ===== 安全登录流程 =====

  function bindFormSubmit() {
    var form = document.getElementById('loginForm');
    if (!form) return;

    form.addEventListener('submit', function(e) {
      e.preventDefault();
      var username = document.getElementById('username');
      var password = document.getElementById('password');
      if (!username.value || !password.value) {
        shakeCard();
        return;
      }
      submitLogin(username.value, password.value);
    });
  }

  function submitLogin(username, password) {
    showLoading(true);

    var xhr = new XMLHttpRequest();
    xhr.open('POST', OASISIC_API_PATH + '/login_check', true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

    xhr.onload = function() {
      showLoading(false);
      if (xhr.status === 200) {
        try {
          var data = JSON.parse(xhr.responseText);
          if (!data.success) {
            shakeCard();
            showError(data.message || '登录失败');
            return;
          }

          if (data.totp_required) {
            // TOTP 已启用：保存票据，显示 TOTP 输入
            pendingTicket = data.ticket;
            showTOTPStep();
          } else {
            // TOTP 未启用：session 已签发，跳转
            window.location.href = data.redirect || '/cgi-bin/luci/admin';
          }
        } catch (e) {
          shakeCard();
          showError('服务器响应异常');
        }
      } else {
        shakeCard();
        showError('服务器错误 (' + xhr.status + ')');
      }
    };

    xhr.onerror = function() {
      showLoading(false);
      showError('网络错误');
    };

    xhr.send('username=' + encodeURIComponent(username) +
      '&password=' + encodeURIComponent(password));
  }

  // ===== TOTP 验证步骤 =====

  function showTOTPStep() {
    document.getElementById('loginStep1').style.display = 'none';
    document.getElementById('loginStep2').style.display = 'block';
    document.getElementById('totp-code').focus();
  }

  function backToLogin() {
    document.getElementById('loginStep2').style.display = 'none';
    document.getElementById('loginStep1').style.display = 'block';
    pendingTicket = null;
  }

  function bindTOTPSubmit() {
    var btn = document.getElementById('totp-verify-btn');
    if (btn) {
      btn.addEventListener('click', verifyTOTP);
    }
  }

  function bindTOTPInput() {
    var input = document.getElementById('totp-code');
    if (input) {
      input.addEventListener('input', function() {
        hideError();
        if (this.value.length === 6) {
          setTimeout(verifyTOTP, 200);
        }
      });
      input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && this.value.length === 6) verifyTOTP();
      });
    }
  }

  function verifyTOTP() {
    var code = document.getElementById('totp-code').value.trim();
    if (!code || code.length !== 6) {
      showError('请输入 6 位验证码');
      return;
    }
    if (!pendingTicket) {
      showError('会话已过期，请重新登录');
      return;
    }

    showLoading(true);
    var btn = document.getElementById('totp-verify-btn');
    if (btn) btn.disabled = true;

    var xhr = new XMLHttpRequest();
    xhr.open('POST', OASISIC_API_PATH + '/login_verify', true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

    xhr.onload = function() {
      showLoading(false);
      if (btn) btn.disabled = false;
      if (xhr.status === 200) {
        try {
          var data = JSON.parse(xhr.responseText);
          if (data.success) {
            window.location.href = '/cgi-bin/luci/admin';
          } else {
            showError(data.message || '验证码无效');
            document.getElementById('totp-code').value = '';
            document.getElementById('totp-code').focus();
            shakeCard();
          }
        } catch (e) {
          showError('服务器响应异常');
        }
      } else {
        showError('验证失败 (' + xhr.status + ')');
        if (btn) btn.disabled = false;
      }
    };

    xhr.onerror = function() {
      showLoading(false);
      showError('网络错误');
      if (btn) btn.disabled = false;
    };

    xhr.send('code=' + encodeURIComponent(code) + '&ticket=' + encodeURIComponent(pendingTicket));
  }

  // ===== 通用 =====

  function showLoading(show) {
    var btn = document.getElementById('loginBtn') || document.getElementById('totp-verify-btn');
    if (btn) btn.disabled = show;
    var spinner = document.getElementById('loginSpinner');
    if (spinner) spinner.style.display = show ? 'block' : 'none';
  }

  function shakeCard() {
    var card = document.getElementById('loginCard');
    if (card) {
      card.classList.remove('shake');
      void card.offsetWidth;
      card.classList.add('shake');
      setTimeout(function() { card.classList.remove('shake'); }, 500);
    }
  }

  function showError(msg) {
    var el = document.getElementById('loginError');
    if (el) {
      el.textContent = msg;
      el.style.display = 'block';
    }
  }

  function hideError() {
    var el = document.getElementById('loginError');
    if (el) el.style.display = 'none';
  }

  function passkeyAuth() {
    if (window.PublicKeyCredential) {
      Oasisic.showToast('Passkey 认证尚未完成配置', 'info');
    } else {
      Oasisic.showToast('当前设备不支持 Passkey', 'error');
    }
  }

  return {
    init: init,
    passkeyAuth: passkeyAuth,
    verifyTOTP: verifyTOTP,
    backToLogin: backToLogin,
  };
})();