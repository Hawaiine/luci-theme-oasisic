/*!
 * Oasisic theme - shell behaviour (no dependencies, no network calls).
 * Owns: the appearance switch (auto -> light -> dark), the sidebar
 * collapse (desktop) and the off-canvas open/close (phones). The initial
 * data-darkmode / data-sidebar attributes are set by an inline script in
 * the document head so the first paint already has the right colours.
 */
(function () {
	'use strict';

	var THEME_KEY = 'oasisic.theme';
	var SIDE_KEY = 'oasisic.sidebar';
	var ORDER = [ 'auto', 'light', 'dark' ];

	function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
	function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

	function prefersDark() {
		return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
	}

	function applyTheme(mode) {
		var dark = (mode === 'dark') || (mode !== 'light' && prefersDark());
		document.documentElement.setAttribute('data-theme', mode);
		document.documentElement.setAttribute('data-darkmode', dark ? 'true' : 'false');
	}

	function cycleTheme() {
		var cur = get(THEME_KEY) || 'auto';
		var next = ORDER[(ORDER.indexOf(cur) + 1) % ORDER.length];
		set(THEME_KEY, next);
		applyTheme(next);
		var btn = document.getElementById('oasisic-theme-btn');
		if (btn) btn.setAttribute('title', 'Appearance: ' + next);
	}

	function toggleSidebar() {
		var doc = document.documentElement;
		var btn = document.getElementById('oasisic-toggle');
		var narrow = window.matchMedia && window.matchMedia('(max-width: 900px)').matches;

		if (narrow) {
			var open = doc.getAttribute('data-sidebar-open') === 'true';
			doc.setAttribute('data-sidebar-open', open ? 'false' : 'true');
			if (btn) btn.setAttribute('aria-expanded', open ? 'false' : 'true');
			return;
		}

		var collapsed = doc.getAttribute('data-sidebar') === 'collapsed';
		doc.setAttribute('data-sidebar', collapsed ? 'expanded' : 'collapsed');
		set(SIDE_KEY, collapsed ? 'expanded' : 'collapsed');
		if (btn) btn.setAttribute('aria-expanded', collapsed ? 'true' : 'false');
	}

	function closeOnMobile() {
		if (window.matchMedia && window.matchMedia('(max-width: 900px)').matches)
			document.documentElement.setAttribute('data-sidebar-open', 'false');
	}

	function init() {
		var btn = document.getElementById('oasisic-theme-btn');
		if (btn) {
			btn.addEventListener('click', cycleTheme);
			btn.setAttribute('title', 'Appearance: ' + (get(THEME_KEY) || 'auto'));
		}

		var toggle = document.getElementById('oasisic-toggle');
		if (toggle) toggle.addEventListener('click', toggleSidebar);

		/* tapping the page on a phone closes the drawer */
		var main = document.getElementById('maincontent');
		if (main) main.addEventListener('click', closeOnMobile);

		/* "auto" follows the operating system live */
		if (window.matchMedia) {
			var mq = window.matchMedia('(prefers-color-scheme: dark)');
			var onChange = function () {
				if ((get(THEME_KEY) || 'auto') === 'auto') applyTheme('auto');
			};
			if (mq.addEventListener) mq.addEventListener('change', onChange);
			else if (mq.addListener) mq.addListener(onChange);
		}

		applyTheme(get(THEME_KEY) || 'auto');
	}

	if (document.readyState === 'loading')
		document.addEventListener('DOMContentLoaded', init);
	else
		init();
})();
