'use strict';
'require baseclass';
'require ui';

/*
 * Oasisic theme - sidebar navigation.
 *
 * Everything comes from ui.menu (the menu tree is ACL-filtered on the
 * server) and L.url(); nothing is fetched by hand and no markup is built
 * from strings. Text is always passed inside an array, which LuCI's E()
 * inserts as text nodes, so a translated title can never become markup.
 */

/* 24px stroke icons drawn for this theme: constant [tag, attributes]
   lists, built with createElementNS - no markup parsing, no user data. */
var ICONS = {
	status:    [ [ 'path', { d: 'M3 12h3.5l2.5-6.5 5 13 2.5-6.5H21' } ] ],
	network:   [ [ 'rect', { x: '9', y: '3', width: '6', height: '5', rx: '1' } ],
	             [ 'rect', { x: '3', y: '16', width: '6', height: '5', rx: '1' } ],
	             [ 'rect', { x: '15', y: '16', width: '6', height: '5', rx: '1' } ],
	             [ 'path', { d: 'M12 8v4M6 16v-2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2' } ] ],
	system:    [ [ 'circle', { cx: '12', cy: '12', r: '3' } ],
	             [ 'path', { d: 'M12 1v3m0 16v3M4.22 4.22l2.12 2.12m11.32 11.32l2.12 2.12M1 12h3m16 0h3M4.22 19.78l2.12-2.12m11.32-11.32l2.12-2.12' } ] ],
	services:  [ [ 'rect', { x: '3', y: '3', width: '7', height: '7', rx: '1' } ],
	             [ 'rect', { x: '14', y: '3', width: '7', height: '7', rx: '1' } ],
	             [ 'rect', { x: '14', y: '14', width: '7', height: '7', rx: '1' } ],
	             [ 'rect', { x: '3', y: '14', width: '7', height: '7', rx: '1' } ] ],
	logout:    [ [ 'path', { d: 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4' } ],
	             [ 'polyline', { points: '16 17 21 12 16 7' } ],
	             [ 'line', { x1: '21', y1: '12', x2: '9', y2: '12' } ] ],
	vpn:       [ [ 'rect', { x: '3', y: '11', width: '18', height: '11', rx: '2', ry: '2' } ],
	             [ 'path', { d: 'M7 11V7a5 5 0 0110 0v4' } ] ],
	firewall:  [ [ 'rect', { x: '4', y: '4', width: '16', height: '16', rx: '2' } ],
	             [ 'path', { d: 'M9 9h6M9 13h6M9 17h2' } ] ],
	nas:       [ [ 'ellipse', { cx: '12', cy: '5', rx: '9', ry: '3' } ],
	             [ 'path', { d: 'M21 12c0 1.66-4 3-9 3s-9-1.34-9-3' } ],
	             [ 'path', { d: 'M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5' } ] ],
	wifi:      [ [ 'path', { d: 'M5 12.55a11 11 0 0114.08 0' } ],
	             [ 'path', { d: 'M1.42 9a16 16 0 0121.16 0' } ],
	             [ 'path', { d: 'M8.53 16.11a6 6 0 016.95 0' } ],
	             [ 'line', { x1: '12', y1: '20', x2: '12.01', y2: '20' } ] ],
	nvim:      [ [ 'rect', { x: '2', y: '3', width: '20', height: '14', rx: '2' } ],
	             [ 'path', { d: 'M6 7h.01M10 7h.01M14 7h.01' } ] ],
	generic:   [ [ 'circle', { cx: '12', cy: '12', r: '10' } ],
	             [ 'path', { d: 'M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3' } ],
	             [ 'line', { x1: '12', y1: '17', x2: '12.01', y2: '17' } ] ]
};

function svgNode(tag) {
	return document.createElementNS('http://www.w3.org/2000/svg', tag);
}

function svgAttr(el, k, v) {
	switch (k) {
	case 'd': case 'x': case 'y': case 'x1': case 'y1': case 'x2': case 'y2':
	case 'cx': case 'cy': case 'r': case 'rx': case 'ry':
	case 'width': case 'height': case 'viewBox': case 'points':
	case 'stroke': case 'stroke-width': case 'stroke-linecap': case 'stroke-linejoin':
	case 'fill': case 'fill-rule': case 'class':
		el.setAttribute(k, v);
		break;
	}
}

function svgIcon(iconKey) {
	var parts = ICONS[iconKey] || ICONS['generic'];
	var s = svgNode('svg');
	svgAttr(s, 'viewBox', '0 0 24 24');
	svgAttr(s, 'width', '20');
	svgAttr(s, 'height', '20');
	svgAttr(s, 'stroke', 'currentColor');
	svgAttr(s, 'stroke-width', '1.5');
	svgAttr(s, 'stroke-linecap', 'round');
	svgAttr(s, 'stroke-linejoin', 'round');
	svgAttr(s, 'fill', 'none');
	parts.forEach(function (part) {
		var el = svgNode(part[0]);
		Object.keys(part[1]).forEach(function (k) { svgAttr(el, k, part[1][k]); });
		s.appendChild(el);
	});
	return s;
}

function iconFor(node) {
	var name = String(node.name || '');
	if (ICONS[name]) return name;
	if (/^(vpn|ipsec|openvpn|wireguard)$/i.test(name)) return 'vpn';
	if (/^(services|startup)$/i.test(name)) return 'services';
	if (/^(nas|storage|mount)$/i.test(name)) return 'nas';
	if (/^(wireless|wifi)$/i.test(name)) return 'wifi';
	return 'generic';
}

return baseclass.extend({
	__init__() {
		var el = document.getElementById('oasisic-menu');
		if (!el) return;
		ui.menu.load().then(function (tree) { this.render(el, tree); }.bind(this));
	},

	/* The sidebar lists the children of the "admin" node (status, network,
	   services, system, ...); the level-3 pages of the active section are
	   shown beneath it. */
	render(el, tree) {
		var root = (tree && tree.children && tree.children.admin) || tree;
		var children = ui.menu.getChildren(root);
		var dispatch = L.env.dispatchpath || [];
		var self = this;

		children.forEach(function (node) {
			// FIX: dispatch[0] is always 'admin'; compare dispatch[1] against node.name
			var active = (dispatch[1] === node.name);

			var link = E('a', {
				'class': 'oasisic-nav-link' + (active ? ' active' : ''),
				'href': L.url('admin', node.name)
			}, [ svgIcon(iconFor(node)), E('span', { 'class': 'oasisic-nav-label' }, [ _(node.title) ]) ]);

			var li = E('li', { 'class': 'oasisic-nav-item' + (active ? ' active' : '') }, [ link ]);

			if (active)
				self.renderSub(li, node);

			el.appendChild(li);
		});
	},

	renderSub(li, node) {
		var dispatch = L.env.dispatchpath || [];
		var children = ui.menu.getChildren(node);
		if (!children.length) return;

		var ul = E('ul', { 'class': 'oasisic-nav-submenu' });
		children.forEach(function (child) {
			var active = (dispatch[2] === child.name);
			ul.appendChild(E('li', { 'class': 'oasisic-nav-subitem' }, [
				E('a', {
					'class': 'oasisic-nav-sublink' + (active ? ' active' : ''),
					'href': L.url('admin', node.name, child.name)
				}, [ _(child.title) ])
			]));
		});
		li.appendChild(ul);
	}
});
