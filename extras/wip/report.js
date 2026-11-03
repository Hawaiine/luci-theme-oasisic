/*!
 * luci-theme-oasisic — 系统健康报告
 * v1.0.0
 * 一键生成系统状态 PDF 报告（打印到 PDF）
 */

var OasisicReport = (function() {
  'use strict';

  function generate() {
    // 收集系统信息
    var report = {
      generated: new Date().toLocaleString(),
      hostname: getText('[data-stat="hostname"]') || 'OpenWrt',
      uptime: getText('[data-stat="uptime"]'),
      load: getText('[data-stat="load"]'),
      cpu: getText('[data-stat="cpu"]'),
      mem: getText('[data-stat="mem"]'),
      storage: getText('[data-stat="storage"]'),
      fw: getText('[data-stat="firmware"]'),
      kernel: getText('[data-stat="kernel"]'),
      lan_ip: getText('[data-stat="lan-ip"]'),
      gateway: getText('[data-stat="gateway"]'),
      dns: getText('[data-stat="dns"]'),
      nikki_mode: getText('[data-stat="nikki-mode"]'),
      nikki_node: getText('[data-stat="nikki-node"]'),
      nikki_traffic: getText('[data-stat="nikki-tx"]') + ' / ' + (getText('[data-stat="nikki-rx"]') || ''),
    };

    // 打开打印窗口
    var win = window.open('', '_blank', 'width=800,height=600');
    if (!win) {
      Oasisic.showToast('请允许弹出窗口', 'error');
      return;
    }

    win.document.write('<!DOCTYPE html><html><head><meta charset="utf-8">');
    win.document.write('<title>Oasisic 系统健康报告</title>');
    win.document.write('<style>');
    win.document.write('*{margin:0;padding:0;box-sizing:border-box;}');
    win.document.write('body{font-family:system-ui,-apple-system,sans-serif;padding:40px;color:#1d1d1f;}');
    win.document.write('h1{font-size:22px;font-weight:700;margin-bottom:4px;}');
    win.document.write('.sub{color:#86868b;font-size:13px;margin-bottom:24px;}');
    win.document.write('h2{font-size:15px;font-weight:600;margin:20px 0 10px;padding-bottom:6px;border-bottom:1px solid #e8e8ed;}');
    win.document.write('table{width:100%;border-collapse:collapse;font-size:13px;}');
    win.document.write('td{padding:6px 10px;border-bottom:1px solid #f0f0f0;}');
    win.document.write('td:first-child{color:#86868b;width:140px;}');
    win.document.write('td:last-child{font-weight:500;}');
    win.document.write('.green{color:#30d158;}.blue{color:#0071e3;}');
    win.document.write('@media print{body{padding:20px;}}');
    win.document.write('</style></head><body>');

    // Header
    win.document.write('<h1>🏝️ Oasisic 系统健康报告</h1>');
    win.document.write('<div class="sub">生成时间: ' + report.generated + '</div>');

    // System Info
    win.document.write('<h2>系统信息</h2><table>');
    win.document.write('<tr><td>设备名称</td><td>' + report.hostname + '</td></tr>');
    win.document.write('<tr><td>固件版本</td><td>' + report.fw + '</td></tr>');
    win.document.write('<tr><td>内核版本</td><td>' + report.kernel + '</td></tr>');
    win.document.write('<tr><td>运行时间</td><td>' + report.uptime + '</td></tr>');
    win.document.write('<tr><td>系统负载</td><td>' + report.load + '</td></tr>');
    win.document.write('</table>');

    // Resource Usage
    win.document.write('<h2>资源使用</h2><table>');
    win.document.write('<tr><td>CPU</td><td>' + report.cpu + '</td></tr>');
    win.document.write('<tr><td>内存</td><td>' + report.mem + '</td></tr>');
    win.document.write('<tr><td>存储</td><td>' + report.storage + '</td></tr>');
    win.document.write('</table>');

    // Network
    win.document.write('<h2>网络状态</h2><table>');
    win.document.write('<tr><td>LAN IP</td><td>' + report.lan_ip + '</td></tr>');
    win.document.write('<tr><td>默认网关</td><td>' + report.gateway + '</td></tr>');
    win.document.write('<tr><td>DNS</td><td>' + report.dns + '</td></tr>');
    win.document.write('</table>');

    // Nikki
    win.document.write('<h2>代理状态</h2><table>');
    win.document.write('<tr><td>代理模式</td><td>' + report.nikki_mode + '</td></tr>');
    win.document.write('<tr><td>当前节点</td><td>' + report.nikki_node + '</td></tr>');
    win.document.write('<tr><td>今日流量</td><td>' + report.nikki_traffic + '</td></tr>');
    win.document.write('</table>');

    // Footer
    win.document.write('<div style="margin-top:30px;color:#c7c7cc;font-size:11px;text-align:center;">');
    win.document.write('luci-theme-oasisic v1.0.0 · Oasisic OpenWrt</div>');

    win.document.write('</body></html>');
    win.document.close();

    // Trigger print
    setTimeout(function() {
      win.focus();
      win.print();
    }, 500);
  }

  function getText(selector) {
    var el = document.querySelector(selector);
    return el ? el.textContent.trim() : '—';
  }

  return {
    generate: generate,
  };
})();