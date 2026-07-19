'use strict';
'require baseclass';
'require ui';

return L.Class.extend({
	__init__: function() {
		var menuEl = document.getElementById('oasisicMenu');
		if (!menuEl) return;
		this.renderMenu(menuEl);
	},

	renderMenu: function(container) {
		var self = this;
		L.system('/cgi-bin/luci/admin/menu', null, function(jsondata) {
			try {
				var data = JSON.parse(jsondata);
				if (data && data.menu) {
					self.buildMenu(container, data.menu);
				}
			} catch(e) {
				// Fallback: try ubus call
				L.ubus('luci', 'get_menu', {}, function(r) {
					if (r && r.menu) self.buildMenu(container, r.menu);
				});
			}
		});
	},

	buildMenu: function(container, items) {
		if (!items || !items.length) return;
		var html = '';
		var currentPath = window.location.pathname;
		var priority = { 'status': 1, 'network': 2, 'services': 3, 'system': 999 };
		items.sort(function(a, b) {
			var pa = priority[a.module] || 50;
			var pb = priority[b.module] || 50;
			return pa - pb;
		});
		for (var i = 0; i < items.length; i++) {
			var item = items[i];
			if (!item.title) continue;
			if (!item.children && item.target === 'firstchild') continue;
			var isActive = item.module ? currentPath.indexOf('/' + item.module) > -1 : false;
			html += '<li class="oasisic-nav-item' + (isActive ? ' active' : '') + '">';
			var url = item.path || '#' + item.module;
			html += '<a href="' + L.url(url) + '" class="oasisic-nav-link">';
			html += '<span class="oasisic-nav-label">' + L._(item.title) + '</span>';
			html += '</a>';
			if (item.children && item.children.length) {
				html += '<ul class="oasisic-nav-submenu">';
				for (var j = 0; j < item.children.length; j++) {
					var child = item.children[j];
					if (!child.title) continue;
					var childActive = child.module ? currentPath.indexOf('/' + child.module) > -1 : false;
					var childUrl = child.path || (item.module + '/' + child.module);
					html += '<li class="oasisic-nav-subitem"><a href="' + L.url(childUrl) + '" class="oasisic-nav-sublink' + (childActive ? ' active' : '') + '">' + L._(child.title) + '</a></li>';
				}
				html += '</ul>';
			}
			html += '</li>';
		}
		container.innerHTML = html;
	}
});