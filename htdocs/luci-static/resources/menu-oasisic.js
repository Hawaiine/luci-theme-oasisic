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
	services:  [ [ 'rect', { x: '4', y: '4', width: '7', height: '7', rx: '1.5' } ],
	             [ 'rect', { x: '13', y: '4', width: '7', height: '7', rx: '1.5' } ],
	             [ 'rect', { x: '4', y: '13', width: '7', height: '7', rx: '1.5' } ],
	             [ 'path', { d: 'M16.5 13v7M13 16.5h7' } ] ],
	system:    [ [ 'rect', { x: '5.5', y: '5.5', width: '13', height: '13', rx: '2' } ],
	             [ 'rect', { x: '9.5', y: '9.5', width: '5', height: '5', rx: '.8' } ],
	             [ 'path', { d: 'M9.5 2.5v3M14.5 2.5v3M9.5 18.5v3M14.5 18.5v3M2.5 9.5h3M2.5 14.5h3M18.5 9.5h3M18.5 14.5h3' } ] ],
	vpn:       [ [ 'path', { d: 'M12 3 5 6v5c0 4.5 3 8.2 7 10 4-1.8 7-5.5 7-10V6z' } ],
	             [ 'path', { d: 'm9 12 2 2 4-4' } ] ],
	statistics:[ [ 'path', { d: 'M5 20v-8M10 20V5M15 20v-5M20 20V9M3 20.5h18' } ] ],
	generic:   [ [ 'circle', { cx: '12', cy: '12', r: '8' } ],
	             [ 'circle', { cx: '12', cy: '12', r: '2.2' } ] ]
};

var SVGNS = 'http://www.w3.org/2000/svg';

/* Tags and attribute names are closed sets written as literals: anything
   else throws, so no caller can create script/a/foreignObject or set href,
   style or an on* handler through this helper. */
function svgNode(tag) {
	switch (tag) {
	case 'svg': return document.createElementNS(SVGNS, 'svg');
	case 'path': return document.createElementNS(SVGNS, 'path');
	case 'rect': return document.createElementNS(SVGNS, 'rect');
	case 'circle': return document.createElementNS(SVGNS, 'circle');
	}
	throw new Error('svg: tag not allowed: ' + tag);
}

function svgAttr(el, k, v) {
	switch (k) {
	case 'viewBox': el.setAttribute('viewBox', String(v)); break;
	case 'width': el.setAttribute('width', String(v)); break;
	case 'height': el.setAttribute('height', String(v)); break;
	case 'class': el.setAttribute('class', String(v)); break;
	case 'd': el.setAttribute('d', String(v)); break;
	case 'x': case 'y': case 'rx': case 'cx': case 'cy': case 'r':
		el.setAttribute(k, String(v)); break;
	default: throw new Error('svg: attribute not allowed: ' + k);
	}
}

function svgIcon(name) {
	var s = svgNode('svg');
	svgAttr(s, 'viewBox', '0 0 24 24');
	svgAttr(s, 'width', 18);
	svgAttr(s, 'height', 18);
	svgAttr(s, 'class', 'oasisic-nav-icon');
	(ICONS[name] || ICONS.generic).forEach(function (part) {
		var el = svgNode(part[0]);
		Object.keys(part[1]).forEach(function (k) { svgAttr(el, k, part[1][k]); });
		s.appendChild(el);
	});
	return s;
}

function iconFor(node) {
	var name = String(node.name || '');
	if (ICONS[name]) return name;
	if (/^(vpn|services)$/.test(name)) return 'services';
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
			var active = (dispatch[0] === node.name);

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
			var active = (dispatch[1] === child.name);
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
