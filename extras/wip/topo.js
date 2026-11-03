/*!
 * luci-theme-oasisic — 网络拓扑可视化
 * v1.0.0
 * 局域网设备交互式拓扑图，纯 Canvas 无外部依赖
 */

var OasisicTopo = (function() {
  'use strict';

  var canvas, ctx;
  var W = 800, H = 500;
  var nodes = [];
  var edges = [];
  var dragNode = null;
  var animFrame = null;

  var COLORS = {
    gateway: '#0071e3',
    router: '#0071e3',
    ap: '#34c759',
    switch: '#ff9f0a',
    client: '#86868b',
    unknown: '#aeaeb2',
    proxy: '#af52de',
  };

  function init(canvasId) {
    canvas = document.getElementById(canvasId);
    if (!canvas) return;

    canvas.width = W;
    canvas.height = H;
    ctx = canvas.getContext('2d');

    buildTopology();
    bindEvents();
    animate();
  }

  function buildTopology() {
    var cx = W / 2;
    var cy = H / 2;

    // 中心节点：主路由
    nodes.push({
      id: 'gateway', label: 'RouterOS\n10.10.10.253',
      x: cx, y: cy - 60, r: 36,
      color: COLORS.gateway, type: 'gateway',
    });

    // 本机：旁路网关
    nodes.push({
      id: 'self', label: 'Oasisic 旁路\n10.10.10.252',
      x: cx - 120, y: cy + 40, r: 32,
      color: COLORS.router, type: 'router',
    });

    // 代理节点
    nodes.push({
      id: 'proxy', label: 'AWS-JP\n42ms',
      x: cx + 160, y: cy - 80, r: 28,
      color: COLORS.proxy, type: 'proxy',
    });

    // 客户端设备
    var clients = [
      { id: 'c1', label: '台式机\n192.168.1.100', x: cx - 180, y: cy + 140 },
      { id: 'c2', label: 'iPhone\n192.168.1.101', x: cx - 60, y: cy + 160 },
      { id: 'c3', label: 'MacBook\n192.168.1.102', x: cx + 80, y: cy + 150 },
    ];

    clients.forEach(function(c) {
      nodes.push({
        id: c.id, label: c.label,
        x: c.x, y: c.y, r: 24,
        color: COLORS.client, type: 'client',
      });
    });

    // 连接
    edges.push({ from: 'gateway', to: 'self' });
    edges.push({ from: 'self', to: 'proxy' });
    edges.push({ from: 'self', to: 'c1' });
    edges.push({ from: 'self', to: 'c2' });
    edges.push({ from: 'self', to: 'c3' });
  }

  function bindEvents() {
    canvas.addEventListener('mousedown', function(e) {
      var node = getNodeAt(e);
      if (node) {
        dragNode = node;
        canvas.style.cursor = 'grabbing';
      }
    });

    canvas.addEventListener('mousemove', function(e) {
      if (dragNode) {
        var rect = canvas.getBoundingClientRect();
        dragNode.x = e.clientX - rect.left;
        dragNode.y = e.clientY - rect.top;
      } else {
        var hover = getNodeAt(e);
        canvas.style.cursor = hover ? 'pointer' : 'default';
        canvas.title = hover ? hover.label : '';
      }
    });

    canvas.addEventListener('mouseup', function() {
      dragNode = null;
      canvas.style.cursor = 'default';
    });

    canvas.addEventListener('mouseleave', function() {
      dragNode = null;
    });
  }

  function getNodeAt(e) {
    var rect = canvas.getBoundingClientRect();
    var mx = e.clientX - rect.left;
    var my = e.clientY - rect.top;

    for (var i = nodes.length - 1; i >= 0; i--) {
      var dx = mx - nodes[i].x;
      var dy = my - nodes[i].y;
      if (dx * dx + dy * dy < (nodes[i].r + 10) * (nodes[i].r + 10)) {
        return nodes[i];
      }
    }
    return null;
  }

  function animate() {
    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = '#f5f5f7';
    ctx.fillRect(0, 0, W, H);

    // Spring forces for layout
    edges.forEach(function(e) {
      var from = nodes.find(function(n) { return n.id === e.from; });
      var to = nodes.find(function(n) { return n.id === e.to; });
      if (!from || !to) return;

      // Edge line
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);

      // Color by type
      if (e.to === 'proxy') {
        ctx.strokeStyle = 'rgba(175, 82, 222, 0.3)';
        ctx.setLineDash([4, 4]);
      } else {
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.06)';
        ctx.setLineDash([]);
      }
      ctx.lineWidth = 2;
      ctx.stroke();
    });
    ctx.setLineDash([]);

    // Nodes
    nodes.forEach(function(node) {
      // Glow
      var grad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.r * 2);
      grad.addColorStop(0, node.color + '20');
      grad.addColorStop(1, node.color + '00');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.r * 2, 0, Math.PI * 2);
      ctx.fill();

      // Circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
      ctx.fillStyle = node.color;
      ctx.fill();

      // Inner dot for non-proxy, proxy icon for proxy
      if (node.type === 'proxy') {
        ctx.fillStyle = '#fff';
        ctx.font = '14px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚡', node.x, node.y);
      } else if (node.type === 'client') {
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r * 0.35, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r * 0.25, 0, Math.PI * 2);
        ctx.fill();
        // Connection lines
        var dots = 4;
        for (var i = 0; i < dots; i++) {
          var angle = (Math.PI * 2 / dots) * i;
          var dx = node.r * 1.2 * Math.cos(angle);
          var dy = node.r * 1.2 * Math.sin(angle);
          ctx.fillStyle = 'rgba(255,255,255,0.3)';
          ctx.beginPath();
          ctx.arc(node.x + dx, node.y + dy, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Label
      ctx.fillStyle = '#1d1d1f';
      ctx.font = '11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      var lines = node.label.split('\n');
      lines.forEach(function(line, i) {
        ctx.fillStyle = i === 0 ? '#1d1d1f' : '#86868b';
        ctx.fillText(line, node.x, node.y + node.r + 6 + i * 15);
      });
    });

    // Legend
    var legendX = 16;
    var legendY = H - 80;
    var legendItems = [
      { label: '主路由', color: COLORS.gateway },
      { label: '旁路网关', color: COLORS.router },
      { label: '代理节点', color: COLORS.proxy },
      { label: '客户端', color: COLORS.client },
    ];

    ctx.font = '10px system-ui, sans-serif';
    legendItems.forEach(function(item, i) {
      var y = legendY + i * 18;
      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.arc(legendX + 6, y + 4, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#86868b';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.label, legendX + 16, y + 4);
    });

    animFrame = requestAnimationFrame(animate);
  }

  return {
    init: init,
  };
})();