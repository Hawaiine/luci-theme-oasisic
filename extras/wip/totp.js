/*!
 * luci-theme-oasisic — TOTP 两步验证
 * v1.0.0
 */

var OasisicTOTP = (function() {
  'use strict';

  function init() {
    fetchStatus();
    bindCodeInput();
  }

  function fetchStatus() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', OASISIC_API_PATH + '/status', true);
    xhr.onload = function() {
      if (xhr.status === 200) {
        try {
          var data = JSON.parse(xhr.responseText);
          renderStatus(data);
        } catch (e) {
          showError('状态获取失败');
        }
      }
    };
    xhr.send();
  }

  function renderStatus(data) {
    document.getElementById('totp-loading').style.display = 'none';

    if (!data.available) {
      document.getElementById('totp-not-available').style.display = 'block';
      return;
    }

    if (data.enabled) {
      document.getElementById('totp-active').style.display = 'block';
    } else {
      document.getElementById('totp-setup').style.display = 'block';
    }
  }

  function generate() {
    var btn = document.getElementById('totp-generate-btn');
    btn.disabled = true;
    btn.textContent = '⏳ 生成中...';

    var xhr = new XMLHttpRequest();
    xhr.open('POST', OASISIC_API_PATH + '/generate', true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.onload = function() {
      btn.disabled = false;
      btn.textContent = '🔑 生成密钥';
      if (xhr.status === 200) {
        try {
          var data = JSON.parse(xhr.responseText);
          if (data.success) {
            showSecret(data);
          } else {
            alert(data.message || '生成失败');
          }
        } catch (e) {
          alert('响应解析失败');
        }
      }
    };
    xhr.send();
  }

  function showSecret(data) {
    document.getElementById('totp-secret-area').style.display = 'block';
    document.getElementById('totp-secret-text').textContent = data.secret;

    // 生成二维码（使用内联方式显示 otpauth URL）
    var qrContainer = document.getElementById('totp-qr');
    qrContainer.innerHTML = '';

    // 使用 QRCode.js 或显示链接
    var link = document.createElement('a');
    link.href = data.otpauth_url;
    link.textContent = '📱 点击打开验证器';
    link.style.cssText = 'display:inline-block;padding:8px 16px;background:#0071e3;color:#fff;border-radius:8px;font-size:13px;text-decoration:none;';
    link.target = '_blank';
    qrContainer.appendChild(link);

    var note = document.createElement('div');
    note.style.cssText = 'font-size:11px;color:var(--text-secondary);margin-top:6px;';
    note.textContent = '部分浏览器不支持直接打开 otpauth://，请手动输入密钥';
    qrContainer.appendChild(note);

    document.getElementById('totp-enable-btn').disabled = false;
    document.getElementById('totp-code').focus();
  }

  function enable() {
    var code = document.getElementById('totp-code').value.trim();
    if (!code || code.length !== 6) {
      showError('请输入 6 位验证码');
      return;
    }

    var btn = document.getElementById('totp-enable-btn');
    btn.disabled = true;
    btn.textContent = '⏳ 验证中...';

    var xhr = new XMLHttpRequest();
    xhr.open('POST', OASISIC_API_PATH + '/enable', true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.onload = function() {
      btn.disabled = false;
      btn.textContent = '启用';
      if (xhr.status === 200) {
        try {
          var data = JSON.parse(xhr.responseText);
          if (data.success) {
            location.reload();
          } else {
            showError(data.message || '验证失败');
            btn.disabled = false;
          }
        } catch (e) {
          showError('响应解析失败');
        }
      }
    };
    xhr.send('code=' + encodeURIComponent(code));
  }

  function disable() {
    if (!confirm('确定要停用两步验证吗？')) return;

    var xhr = new XMLHttpRequest();
    xhr.open('POST', OASISIC_API_PATH + '/disable', true);
    xhr.onload = function() {
      if (xhr.status === 200) {
        location.reload();
      }
    };
    xhr.send();
  }

  function bindCodeInput() {
    var input = document.getElementById('totp-code');
    if (input) {
      input.addEventListener('input', function() {
        hideError();
        if (this.value.length === 6) {
          document.getElementById('totp-enable-btn').disabled = false;
        } else {
          document.getElementById('totp-enable-btn').disabled = true;
        }
      });
    }
  }

  function showError(msg) {
    var el = document.getElementById('totp-error');
    if (el) {
      el.textContent = msg;
      el.style.display = 'block';
    }
  }

  function hideError() {
    var el = document.getElementById('totp-error');
    if (el) el.style.display = 'none';
  }

  return {
    init: init,
    generate: generate,
    enable: enable,
    disable: disable,
  };
})();