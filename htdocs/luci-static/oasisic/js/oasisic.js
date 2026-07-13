/*!
 * luci-theme-oasisic v1.0.0 — Core JavaScript
 * Oasisic OpenWrt
 * Licensed under Apache 2.0
 */

var Oasisic = (function() {
  'use strict';

  var theme = {
    version: '1.0.0',
    name: 'oasisic',
    sidebarCollapsed: false,
    darkMode: false,
  };

  function init() {
    loadThemePreference();
    bindSidebarToggle();
    bindKeyboardShortcuts();
    updatePageTitle();
  }

  function loadThemePreference() {
    var saved = localStorage.getItem('oasisic-theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (saved === 'dark' || (!saved && prefersDark)) {
      theme.darkMode = true;
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      theme.darkMode = false;
      document.documentElement.setAttribute('data-theme', 'light');
    }

    // Listen for system changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
      if (!localStorage.getItem('oasisic-theme')) {
        theme.darkMode = e.matches;
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      }
    });
  }

  function toggleTheme() {
    theme.darkMode = !theme.darkMode;
    var mode = theme.darkMode ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', mode);
    localStorage.setItem('oasisic-theme', mode);
  }

  function toggleSidebar() {
    theme.sidebarCollapsed = !theme.sidebarCollapsed;
    var sidebar = document.querySelector('.oasisic-sidebar');
    if (sidebar) {
      sidebar.classList.toggle('collapsed', theme.sidebarCollapsed);
    }
    localStorage.setItem('oasisic-sidebar', theme.sidebarCollapsed ? 'collapsed' : 'expanded');
  }

  function bindSidebarToggle() {
    var saved = localStorage.getItem('oasisic-sidebar');
    if (saved === 'collapsed') {
      theme.sidebarCollapsed = true;
      var sidebar = document.querySelector('.oasisic-sidebar');
      if (sidebar) sidebar.classList.add('collapsed');
    }
  }

  function bindKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
      // Ctrl+B or Cmd+B to toggle sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
      // T for theme toggle
      if (e.key === 't' && !e.ctrlKey && !e.metaKey && !e.target.matches('input, textarea')) {
        toggleTheme();
      }
    });
  }

  function updatePageTitle() {
    // Update the page title from the first h1/h2 if available
    var title = document.querySelector('h1, h2.oasisic-page-title');
    if (title) {
      document.title = title.textContent.trim() + ' - Oasisic';
    }
  }

  function showToast(message, type) {
    type = type || 'info';
    var toast = document.createElement('div');
    toast.className = 'oasisic-toast ' + type;
    toast.textContent = message;
    document.body.appendChild(toast);
    // Trigger animation
    requestAnimationFrame(function() {
      toast.classList.add('show');
    });
    setTimeout(function() {
      toast.classList.remove('show');
      setTimeout(function() { toast.remove(); }, 300);
    }, 3000);
  }

  return {
    init: init,
    toggleTheme: toggleTheme,
    toggleSidebar: toggleSidebar,
    showToast: showToast,
    version: theme.version,
  };
})();