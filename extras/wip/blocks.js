/*!
 * luci-theme-oasisic — 仪表盘区块编辑器
 * v1.0.0
 * 拖拽排序、显隐控制、配置持久化
 */

var OasisicBlocks = (function() {
  'use strict';

  var STORAGE_KEY = 'oasisic-blocks';
  var editMode = false;
  var dragItem = null;
  var blocks = [];

  function init() {
    loadBlocks();
    bindEditToggle();
  }

  function loadBlocks() {
    var container = document.querySelector('.oasisic-dashboard-blocks');
    if (!container) return;

    blocks = [];
    var items = container.querySelectorAll('[data-block-id]');
    items.forEach(function(el) {
      blocks.push({
        id: el.getAttribute('data-block-id'),
        visible: el.style.display !== 'none',
        order: parseInt(el.getAttribute('data-block-order')) || 0,
        el: el,
      });
    });

    // Apply saved order
    var saved = getSaved();
    if (saved && saved.length > 0) {
      applySavedState(saved);
    }
  }

  function getSaved() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch(e) {
      return null;
    }
  }

  function saveState() {
    var state = blocks.map(function(b) {
      return { id: b.id, visible: b.visible, order: b.order };
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function applySavedState(saved) {
    var container = document.querySelector('.oasisic-dashboard-blocks');
    if (!container) return;

    // Sort by saved order
    var sorted = blocks.slice().sort(function(a, b) {
      var aOrder = (saved.find(function(s) { return s.id === a.id; }) || {}).order || 0;
      var bOrder = (saved.find(function(s) { return s.id === b.id; }) || {}).order || 0;
      return aOrder - bOrder;
    });

    // Reorder DOM elements
    sorted.forEach(function(block) {
      var savedBlock = saved.find(function(s) { return s.id === block.id; });
      if (savedBlock) {
        block.visible = savedBlock.visible;
        block.el.style.display = savedBlock.visible ? '' : 'none';
        block.el.setAttribute('data-block-order', savedBlock.order);
      }
      container.appendChild(block.el);
    });
  }

  // ===== 拖拽 =====

  function enableDrag() {
    editMode = true;
    blocks.forEach(function(block) {
      if (!block.visible) return;
      block.el.setAttribute('draggable', 'true');
      block.el.classList.add('oasisic-block-draggable');

      block.el.addEventListener('dragstart', onDragStart);
      block.el.addEventListener('dragend', onDragEnd);
      block.el.addEventListener('dragover', onDragOver);
      block.el.addEventListener('drop', onDrop);
    });
    showEditorUI(true);
  }

  function disableDrag() {
    editMode = false;
    blocks.forEach(function(block) {
      block.el.removeAttribute('draggable');
      block.el.classList.remove('oasisic-block-draggable');

      block.el.removeEventListener('dragstart', onDragStart);
      block.el.removeEventListener('dragend', onDragEnd);
      block.el.removeEventListener('dragover', onDragOver);
      block.el.removeEventListener('drop', onDrop);
    });
    showEditorUI(false);
  }

  function onDragStart(e) {
    dragItem = this;
    this.classList.add('oasisic-block-dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.getAttribute('data-block-id'));
  }

  function onDragEnd(e) {
    this.classList.remove('oasisic-block-dragging');
    dragItem = null;
  }

  function onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    var target = this.closest('[data-block-id]');
    if (target && target !== dragItem) {
      var rect = target.getBoundingClientRect();
      var midY = rect.top + rect.height / 2;
      var container = target.parentNode;
      if (e.clientY < midY) {
        container.insertBefore(dragItem, target);
      } else {
        container.insertBefore(dragItem, target.nextSibling);
      }
    }
  }

  function onDrop(e) {
    e.preventDefault();
    if (dragItem) {
      // Update order
      var container = document.querySelector('.oasisic-dashboard-blocks');
      if (container) {
        var items = container.querySelectorAll('[data-block-id]');
        items.forEach(function(el, idx) {
          var id = el.getAttribute('data-block-id');
          var block = blocks.find(function(b) { return b.id === id; });
          if (block) {
            block.order = idx;
            el.setAttribute('data-block-order', idx);
          }
        });
        saveState();
      }
    }
  }

  // ===== 显隐控制 =====

  function toggleBlock(blockId) {
    var block = blocks.find(function(b) { return b.id === blockId; });
    if (!block) return;

    block.visible = !block.visible;
    block.el.style.display = block.visible ? '' : 'none';
    saveState();

    if (editMode) {
      // Update editor UI toggle button
      var btn = document.querySelector('[data-toggle="' + blockId + '"]');
      if (btn) {
        btn.textContent = block.visible ? '👁️' : '👁️‍🗨️';
        btn.classList.toggle('hidden', !block.visible);
      }
    }
  }

  // ===== 编辑器 UI =====

  function showEditorUI(showing) {
    var panel = document.querySelector('.oasisic-block-editor');
    if (panel) {
      panel.style.display = showing ? 'block' : 'none';
    }
  }

  function bindEditToggle() {
    var toggleBtn = document.querySelector('[data-action="edit-blocks"]');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', function() {
        if (editMode) {
          disableDrag();
          this.textContent = '✏️ 编辑';
          this.classList.remove('active');
        } else {
          enableDrag();
          this.textContent = '✅ 完成';
          this.classList.add('active');
        }
      });
    }
  }

  function buildEditorPanel() {
    var panel = document.querySelector('.oasisic-block-editor');
    if (!panel) return;

    panel.innerHTML = '';
    blocks.forEach(function(block) {
      var item = document.createElement('div');
      item.className = 'oasisic-editor-item';
      item.innerHTML = '<button class="oasisic-editor-toggle" data-toggle="' + block.id + '">' +
        (block.visible ? '👁️' : '👁️‍🗨️') + '</button>' +
        '<span class="oasisic-editor-label">' + (block.el.getAttribute('data-block-title') || block.id) + '</span>' +
        '<span class="oasisic-editor-drag">⠿</span>';

      var toggleBtn = item.querySelector('.oasisic-editor-toggle');
      toggleBtn.addEventListener('click', function() {
        toggleBlock(block.id);
      });

      panel.appendChild(item);
    });
  }

  return {
    init: init,
    enableDrag: enableDrag,
    disableDrag: disableDrag,
    toggleBlock: toggleBlock,
  };
})();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() { OasisicBlocks.init(); });
} else {
  OasisicBlocks.init();
}