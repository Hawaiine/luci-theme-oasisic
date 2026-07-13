/*!
 * luci-theme-oasisic — Login page
 * v1.0.0
 */

var OasisicLogin = (function() {
  'use strict';

  var WALLPAPER_INTERVAL = 6 * 60 * 60 * 1000;
  var BING_API = 'https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=zh-CN';
  var FALLBACK_BG = 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)';

  var config = {
    totpEnabled: false,
    totpAvailable: false,
  };

  function init(opts) {
    if (opts) {
      config.totpEnabled = opts.totpEnabled || false;
      config.totpAvailable = opts.totpAvailable || false;
    }
    loadWallpaper();
    bindFormSubmit();
    bindTOTPCodeInput();
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
    var img = new Image();
    img.onload = function() { el.style.backgroundImage = 'url(' + url + ')'; };
    img.onerror = function() { fallbackBackground(el); };
    img.src = url;
  }

  function fallbackBackground(el) {
    el.style.backgroundImage = FALLBACK_BG;
  }

  // ===== 登录表单 =====

  function bindFormSubmit() {
    var form = document.getElementById('loginForm');
    if (!form) return;

    form.addEventListener('submit', function(e) {
      var username = document.getElementById('username');
      var password = document.getElementById('password');

      if (!username.value || !password.value) {
        e.preventDefault();
        shakeCard();
        return;
      }

      // 如果 TOTP 已启用，拦截表单提交
      if (config.totpEnabled && config.totpAvailable) {
        e.preventDefault();
        // 先提交密码验证
        submitPassword(username.value, password.value);
      }
      // 否则正常提交（未启用 TOTP 时 LuCI 原生处理）
    });
  }

  function submitPassword(username, password) {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', window.location.href, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.onload = function() {
      if (xhr.status === 200) {
        // 密码正确 → 切到 TOTP 步骤
        showTOTPStep();
      } else if (xhr.status === 403) {
        shakeCard();
        showToast('密码错误，请重试');
      } else {
        // 可能 LuCI 直接返回了重定向（TOTP 未启用时正常登录）
        if (!config.totpEnabled) {
          // 正常表单提交，让页面跳转
          document.getElementById('loginForm').submit();
        }
      }
    };
    xhr.onerror = function() {
      // 网络错误时回退到原生提交
      document.getElementById('loginForm').submit();
    };
    xhr.send('username=' + encodeURIComponent(username) + '&password=' + encodeURIComponent(password) + '&remember=' + (document.getElementById('remember').checked ? '1' : '0'));
  }

  // ===== TOTP 步骤 =====

  function showTOTPStep() {
    document.getElementById('loginStep1').style.display = 'none';
    document.getElementById('loginStep2').style.display = 'block';
    document.getElementById('totp-code').focus();
    document.getElementById('totp-verify-btn').disabled = false;
  }

  function backToLogin() {
    document.getElementById('loginStep2').style.display = 'none';
    document.getElementById('loginStep1').style.display = 'block';
    document.getElementById('password').focus();
  }

  function bindTOTPCodeInput() {
    var input = document.getElementById('totp-code');
    if (input) {
      input.addEventListener('input', function() {
        hideTOTPError();
        if (this.value.length === 6) {
          // 自动提交
          setTimeout(verifyTOTP, 200);
        }
      });
      input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && this.value.length === 6) {
          verifyTOTP();
        }
      });
    }
  }

  function verifyTOTP() {
    var code = document.getElementById('totp-code').value.trim();
    if (!code || code.length !== 6) {
      showTOTPError('请输入 6 位验证码');
      return;
    }

    var btn = document.getElementById('totp-verify-btn');
    btn.disabled = true;
    btn.textContent = '⏳ 验证中...';

    var xhr = new XMLHttpRequest();
    xhr.open('POST', Luci.location.path + '/verify', true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.onload = function() {
      btn.disabled = false;
      btn.textContent = '验证';
      if (xhr.status === 200) {
        try {
          var data = JSON.parse(xhr.responseText);
          if (data.success) {
            // TOTP 验证通过，携带 session 重定向到管理页面
            window.location.href = data.redirect || '/cgi-bin/luci/admin';
          } else {
            showTOTPError(data.message || '验证码无效');
            document.getElementById('totp-code').value = '';
            document.getElementById('totp-code').focus();
            shakeCard();
          }
        } catch (e) {
          showTOTPError('响应解析失败');
        }
      } else {
        showTOTPError('服务器错误');
      }
    };
    xhr.onerror = function() {
      showTOTPError('网络错误');
      btn.disabled = false;
      btn.textContent = '验证';
    };
    xhr.send('code=' + encodeURIComponent(code));
  }

  function showTOTPError(msg) {
    var el = document.getElementById('totp-error');
    if (el) {
      el.textContent = msg;
      el.style.display = 'block';
    }
  }

  function hideTOTPError() {
    var el = document.getElementById('totp-error');
    if (el) el.style.display = 'none';
  }

  // ===== 通用 =====

  function shakeCard() {
    var card = document.getElementById('loginCard');
    if (card) {
      card.classList.remove('shake');
      void card.offsetWidth;
      card.classList.add('shake');
      setTimeout(function() { card.classList.remove('shake'); }, 500);
    }
  }

  function showToast(msg, type) {
    type = type || 'error';
    if (window.Oasisic && Oasisic.showToast) {
      Oasisic.showToast(msg, type);
    } else if (typeof msg === 'string') {
      alert(msg);
    }
  }

  function passkeyAuth() {
    if (window.PublicKeyCredential) {
      showToast('Passkey 认证尚未完成配置', 'info');
    } else {
      showToast('当前设备不支持 Passkey', 'error');
    }
  }

  return {
    init: init,
    passkeyAuth: passkeyAuth,
    verifyTOTP: verifyTOTP,
    backToLogin: backToLogin,
  };
})();